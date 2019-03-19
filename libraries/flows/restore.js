const path = require("path");
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const Seed = require('../../utils/Seed');
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const localFolder = process.cwd();
const RootCSB = require('../RootCSB');
const RawCSB = require('../RawCSB');
const HashCage = require('../../utils/HashCage');
const AsyncDispatcher = require('../../utils/AsyncDispatcher');


$$.swarm.describe("restore", {
    start: function (url) {
        if (url) {
            const {CSBPath, alias} = utils.processUrl(url, 'global.CSBReference');
            this.CSBPath = CSBPath;
            this.CSBAlias = alias;
        }

        this.swarm("interaction", "readSeed")
    },

    restoreCSB: function (seed) {

        this.hashCage = new HashCage(localFolder);
        this.hashObj = {};
        let backupUrls;
        try {
            backupUrls = Seed.getBackupUrls(seed);
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }

        this.backupUrls = backupUrls;
        this.seed = seed;
        this.insertedDseed = Seed.generateCompactForm(Seed.deriveSeed(this.seed));
        this.insertedDseedCage = new DseedCage(localFolder);
        const uid = crypto.generateSafeUid(this.insertedDseed);

        backupUrls = backupUrls.map(url => url + '/CSB/' + uid);
        this.__tryDownload(backupUrls, 0, (err, encryptedCSB) => {
            if (err) {
                return this.swarm("interaction", "handleError", err, "Failed to restore CSB");
            }

            this.__addCSBHash(uid, encryptedCSB);
            this.encryptedCSB = encryptedCSB;

            fs.stat(path.join(localFolder, ".privateSky", "dseed"), (err, stats) => {
                if (err) {
                    this.createAuxFolder();
                } else {
                    this.swarm("interaction", "readPin", flowsUtils.noTries);
                }
            })
        });
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(localFolder, this, "writeCSB", pin, noTries);
    },

    createAuxFolder: function () {
        $$.ensureFolderExists(path.join(localFolder, ".privateSky"), validator.reportOrContinue(this, "writeCSB", "Failed to create folder .privateSky"));
    },


    writeCSB: function () {
        fs.writeFile(utils.generatePath(localFolder, this.insertedDseed), this.encryptedCSB, validator.reportOrContinue(this, "createRootCSBWithDseed", "Failed to write masterCSB to disk"));
    },

    createRootCSBWithDseed: function () {

        RootCSB.loadWithDseed(localFolder, this.insertedDseed, validator.reportOrContinue(this, "loadRawCSB", "Failed to create rootCSB with dseed"));
    },

    loadRawCSB: function (rootCSB) {

        this.asyncDispatcher = new AsyncDispatcher((errs, succs) => {
            this.hashCage.saveHash(this.hashObj, (err) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Failed to save hashObj');
                }
                this.swarm('interaction', 'printInfo', 'All CSBs have been restored.');
            });
        });
        rootCSB.loadRawCSB('', validator.reportOrContinue(this, "checkCSBStatus", "Failed to load RawCSB", rootCSB));
    },

    checkCSBStatus: function (rawCSB, rootCSB) {

        this.rawCSB = rawCSB;
        const meta = this.rawCSB.getAsset('global.CSBMeta', 'meta');
        if (this.rootCSB) {
            this.attachCSB();
        } else {
            if (meta.isMaster) {
                this.rootCSB = rootCSB;
                this.saveDseed();
            } else {
                this.createMasterCSB();
            }
        }
    },

    saveDseed: function () {

        this.insertedDseedCage.saveDseedBackups(flowsUtils.defaultPin, this.insertedDseed, undefined, validator.reportOrContinue(this, "collectFiles", "Failed to save dseed", this.rawCSB, this.insertedDseed, '', 'master'));
    },


    createMasterCSB: function () {

        const seed = Seed.generateCompactForm(Seed.create(this.backupUrls || flowsUtils.defaultBackup));
        const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
        this.swarm("interaction", "printSensitiveInfo", seed, flowsUtils.defaultPin);
        this.rootCSB = RootCSB.createNew(localFolder, dseed);
        this.insertedDseedCage.saveDseedBackups(flowsUtils.defaultPin, dseed, undefined, validator.reportOrContinue(this, "collectFiles", "Failed to save master dseed ", this.rawCSB, dseed, '', 'master'));
    },

    attachCSB: function () {

        this.__attachCSB(this.rootCSB, this.CSBPath, this.CSBAlias, this.seed, this.insertedDseed, validator.reportOrContinue(this, 'loadRestoredRawCSB', 'Failed to attach rawCSB'));

    },

    loadRestoredRawCSB: function () {
        this.CSBPath = this.CSBPath.split(':')[0] + '/' + this.CSBAlias;
        this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, "collectFiles", "Failed to load restored RawCSB", this.insertedDseed, this.CSBPath, this.CSBAlias));
    },

    collectFiles: function (rawCSB, dseed, currentPath, alias, callback) {

        const listFiles = rawCSB.getAllAssets('global.FileReference');
        const asyncDispatcher = new AsyncDispatcher((errs, succs) => {
            this.collectCSBs(rawCSB, dseed, currentPath, alias);
            if (callback) {
                callback(errs, succs);
            }
        });

        if (listFiles.length === 0) {
            asyncDispatcher.markOneAsFinished();
        }

        listFiles.forEach(fileReference => {
            const fileDseed = Buffer.from(fileReference.dseed);
            const fileAlias = fileReference.alias;
            const fileUid = crypto.generateSafeUid(fileDseed);
            const urls = Seed.getBackupUrls(fileDseed).map(url => url + '/CSB/' + fileUid);
            asyncDispatcher.emptyDispatch();
            this.__tryDownload(urls, 0, (err, encryptedFile) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Could not download file ' + fileAlias);
                }

                this.__addCSBHash(fileUid, encryptedFile);

                fs.writeFile(utils.generatePath(localFolder, fileDseed), encryptedFile, (err) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not save file ' + fileAlias);
                    }

                    asyncDispatcher.markOneAsFinished(undefined, fileAlias);
                });
            });
        });
    },

    collectCSBs: function (rawCSB, dseed, currentPath, alias) {

        const listCSBs = rawCSB.getAllAssets('global.CSBReference');
        const nextArguments = [];
        let counter = 0;

        if (listCSBs.length === 0) {
            this.asyncDispatcher.emptyDispatch();
            this.asyncDispatcher.markOneAsFinished();
        }

        if (listCSBs && listCSBs.length > 0) {
            listCSBs.forEach(CSBReference => {
                const nextPath = currentPath + '/' + CSBReference.alias;
                const nextDseed = Buffer.from(CSBReference.dseed);
                const nextAlias = CSBReference.alias;
                const csbUid = crypto.generateSafeUid(nextDseed);
                const nextURLs = Seed.getBackupUrls(nextDseed).map(url => url + '/CSB/' + csbUid);
                this.asyncDispatcher.emptyDispatch();
                this.__tryDownload(nextURLs, 0, (err, encryptedCSB) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not download CSB ' + nextAlias);
                    }

                    this.__addCSBHash(csbUid, encryptedCSB);

                    fs.writeFile(utils.generatePath(localFolder, nextDseed), encryptedCSB, (err) => {
                        if (err) {
                            return this.swarm('interaction', 'handleError', err, 'Could not save CSB ' + nextAlias);
                        }

                        this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

                            if (err) {
                                return this.swarm('interaction', 'handleError', err, 'Failed to load CSB ' + nextAlias);
                            }
                            nextArguments.push([nextRawCSB, nextDseed, nextPath, nextAlias]);

                            if (++counter === listCSBs.length) {
                                nextArguments.forEach(args => {
                                    this.collectFiles(...args, () => {
                                        this.asyncDispatcher.markOneAsFinished(undefined, alias);
                                    });
                                });
                            }
                        });
                    })
                });
            });
        }
    },

    __tryDownload(urls, index, callback) {
        if (index === urls.length) {
            return callback(new Error('Could not download resource'));
        }

        const url = urls[index];

        $$.remote.doHttpGet(url, (err, resource) => {
            if (err) {
                return this.__tryDownload(urls, ++index, callback);
            }

            callback(undefined, resource);
        });

    },

    __addCSBHash: function (csbUid, encryptedCSB) {
        const pskHash = new crypto.PskHash();
        pskHash.update(encryptedCSB);
        this.hashObj[csbUid] = pskHash.digest().toString('hex');

    },

    __attachCSB: function (rootCSB, CSBPath, CSBAlias, seed, dseed, callback) {


        rootCSB.loadRawCSB(CSBPath, (err, rawCSB) => {

            if (err) {
                rootCSB.loadAssetFromPath(CSBPath, (err, csbRef) => {
                    if (err) {
                        return callback(err);
                    }
                    csbRef.init(CSBAlias, seed, dseed);
                    rootCSB.saveAssetToPath(CSBPath, csbRef, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        callback();
                    });

                })
            } else {
                callback(new Error(`A CSB having the alias ${CSBAlias} already exists.`));
            }
        });

    }
});

