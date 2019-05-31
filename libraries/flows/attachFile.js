const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const path = require('path');
const validator = require("../../utils/validator");
const CSBIdentifier = require("../CSBIdentifier");
const HashCage = require('../../utils/HashCage');
const RootCSB = require("../RootCSB");

$$.swarm.describe("attachFile", { //url: CSB1/CSB2/aliasFile
    start: function (url, filePath, localFolder = process.cwd()) { //csb1:assetType:alias
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", flowsUtils.noTries);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadFileReference', pin, noTries);
    },

    withCSBIdentifier: function (id, url, filePath, localFolder = process.cwd()) {
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.csbIdentifier = new CSBIdentifier(id);
        RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, (err, rootCSB) => {
            if (err) {
                this.swarm("interaction", "handleError", err, "Failed to load rootCSB");
                return;
            }

            this.rootCSB = rootCSB;
            this.loadFileReference();

        });
    },

    loadFileReference: function () {
        this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, 'loadAsset', 'Failed to load masterCSB.'));
    },

    loadAsset: function () {
        this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, 'saveFileToDisk', 'Failed to load asset'));
    },

    saveFileToDisk: function (fileReference) {
        if (fileReference.isPersisted()) {
            this.swarm("interaction", "handleError", new Error("File is persisted"), "A file with the same alias already exists ");
            return;
        }

        const csbIdentifier = new CSBIdentifier(undefined, this.csbIdentifier.getBackupUrls());
        this.fileID = utils.generatePath(this.localFolder, csbIdentifier);
        crypto.on('progress', (progress) => {
            this.swarm('interaction', 'reportProgress', progress);
        });
        crypto.encryptStream(this.filePath, this.fileID, csbIdentifier.getDseed(), validator.reportOrContinue(this, 'saveFileReference', "Failed at file encryption.", fileReference, csbIdentifier));

    },


    saveFileReference: function (fileReference, csbIdentifier) {
        crypto.removeAllListeners('progress');
        fileReference.init(this.alias, csbIdentifier.getSeed(), csbIdentifier.getDseed(), this.filePath);
        this.rootCSB.saveAssetToPath(this.CSBPath, fileReference, validator.reportOrContinue(this, 'computeHash', "Failed to save file", this.fileID));
    },


    computeHash: function () {
        const fileStream = fs.createReadStream(this.fileID);
        crypto.pskHashStream(fileStream, validator.reportOrContinue(this, "loadHashObj", "Failed to compute hash"));
    },

    loadHashObj: function (digest) {
        this.hashCage = new HashCage(this.localFolder);
        this.hashCage.loadHash(validator.reportOrContinue(this, "addToHashObj", "Failed to load hashObj", digest));
    },

    addToHashObj: function (hashObj, digest) {
        hashObj[path.basename(this.fileID)] = digest.toString("hex");
        this.hashCage.saveHash(hashObj, validator.reportOrContinue(this, "printSuccess", "Failed to save hashObj"));
    },

    printSuccess: function () {
        this.swarm("interaction", "printInfo", this.filePath + " has been successfully added to " + this.CSBPath);
        this.swarm("interaction", "__return__");
    }
});
