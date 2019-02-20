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
const HashCage = require('../../utils/HashCage');
const AsyncDispatcher = require('../../utils/AsyncDispatcher');

$$.swarm.describe("clone", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.swarm("interaction", "readSeed")
	},

	restoreMaster: function (seed) {
		this.hashCage = new HashCage(localFolder);
		this.hashObj = {};
		let backupUrls;
		try {
			backupUrls = Seed.getBackupUrls(seed);
		} catch (e) {
			return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
		}

		this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.dseedCage = new DseedCage(localFolder);
		const masterUid = crypto.generateSafeUid(this.dseed);

		backupUrls = backupUrls.map(url => url + '/CSB/' + masterUid);
		this.__tryDownload(backupUrls, 0, (err, encryptedMaster) => {
			if (err) {
				return this.swarm("interaction", "handleError", err, "Failed to restore masterCSB");
			}

			this.__addCSBHash(masterUid, encryptedMaster);
			this.createAuxFolder(encryptedMaster);
		});
	},

	createAuxFolder: function (encryptedMasterStream) {
		$$.ensureFolderExists(path.join(localFolder, ".privateSky"), validator.reportOrContinue(this, "writeMaster", "Failed to create folder .privateSky", encryptedMasterStream));
	},

	writeMaster: function (encryptedMasterStream) {
		fs.writeFile(utils.generatePath(localFolder, this.dseed), encryptedMasterStream, validator.reportOrContinue(this, "saveDseed", "Failed to write masterCSB to disk"));
	},

	saveDseed: function () {
		this.dseedCage.saveDseed(flowsUtils.defaultPin, this.dseed, validator.reportOrContinue(this, "createRootCSB", "Failed to save dseed"));
	},
	
	createRootCSB: function () {
		RootCSB.loadWithDseed(localFolder, this.dseed, validator.reportOrContinue(this, "loadMasterRawCSB", "Failed to create rootCSB"));
	},

	loadMasterRawCSB: function (rootCSB) {
		this.rootCSB = rootCSB;
		this.asyncDispatcher = new AsyncDispatcher((errs, succs) => {
			this.hashCage.saveHash(this.hashObj, (err) => {
				if(err) {
					return this.swarm('interaction', 'handleError', err, 'Failed to save hashObj');
				}
				this.swarm('interaction', 'printInfo', 'All CSBs have been restored.');
			});
		});
		this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, "collectFiles", "Failed to load masterRawCSB", this.dseed, '', 'master'));
	},

	collectFiles: function(rawCSB, dseed, currentPath, alias, callback) {
		const listFiles = rawCSB.getAllAssets('global.FileReference');
		const asyncDispatcher = new AsyncDispatcher((errs, succs) => {
			this.collectCSBs(rawCSB, dseed, currentPath, alias);
			if(callback) {
				callback(errs, succs);
			}
		});

		if(listFiles.length === 0) {
			asyncDispatcher.markOneAsFinished();
		}

		listFiles.forEach(fileReference => {
			const fileDseed = Buffer.from(fileReference.dseed);
			const fileAlias = fileReference.alias;
			const fileUid = crypto.generateSafeUid(fileDseed);
			const urls = Seed.getBackupUrls(fileDseed).map(url => url + '/CSB/' + fileUid);
			asyncDispatcher.emptyDispatch();
			this.__tryDownload(urls, 0, (err, encryptedFile) => {
				if(err) {
					return this.swarm('interaction', 'handleError', err, 'Could not download file ' + fileAlias);
				}

				this.__addCSBHash(fileUid, encryptedFile);

				fs.writeFile(utils.generatePath(localFolder, fileDseed), encryptedFile, (err)=>{
					if(err) {
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

		if(listCSBs.length === 0) {
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
					if(err) {
						return this.swarm('interaction', 'handleError', err, 'Could not download CSB ' + nextAlias);
					}

					this.__addCSBHash(csbUid, encryptedCSB);

					fs.writeFile(utils.generatePath(localFolder, nextDseed), encryptedCSB, (err)=>{
						if(err) {
							return this.swarm('interaction', 'handleError', err, 'Could not save CSB ' + nextAlias);
						}

						this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

							if (err) {
								throw err;
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
		if(index === urls.length) {
			return callback(new Error('Could not download resource'));
		}

		const url = urls[index];

		$$.remote.doHttpGet(url, (err, resource) => {
			if(err) {
				return this.__tryDownload(urls, ++index, callback);
			}

			callback(undefined, resource);
		});

	},
	__addCSBHash: function(csbUid, encryptedCSB) {
		const pskHash = new crypto.PskHash();
		pskHash.update(encryptedCSB);
		this.hashObj[csbUid] = pskHash.digest().toString('hex');

	}

});

