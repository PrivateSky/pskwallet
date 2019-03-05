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

const defaultCSBAlias = 'default';

$$.swarm.describe("restore", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
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
		this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.dseedCage = new DseedCage(localFolder);
		const uid = crypto.generateSafeUid(this.dseed);

		backupUrls = backupUrls.map(url => url + '/CSB/' + uid);
		this.__tryDownload(backupUrls, 0, (err, encryptedCSB) => {
			if (err) {
				return this.swarm("interaction", "handleError", err, "Failed to restore CSB");
			}

			this.__addCSBHash(uid, encryptedCSB);
			this.createAuxFolder(encryptedCSB);
		});
	},

	createAuxFolder: function (encryptedCSBStream) {
		$$.ensureFolderExists(path.join(localFolder, ".privateSky"), validator.reportOrContinue(this, "writeCSB", "Failed to create folder .privateSky", encryptedCSBStream));
	},

	writeCSB: function (encryptedMasterStream) {
		fs.writeFile(utils.generatePath(localFolder, this.dseed), encryptedMasterStream, validator.reportOrContinue(this, "createRootCSB", "Failed to write masterCSB to disk"));
	},

	createRootCSB: function () {
		RootCSB.loadWithDseed(localFolder, this.dseed, validator.reportOrContinue(this, "loadRawCSB", "Failed to create rootCSB"));
	},

	loadRawCSB: function (rootCSB) {
		this.rootCSB = rootCSB;
		this.asyncDispatcher = new AsyncDispatcher((errs, succs) => {
			this.hashCage.saveHash(this.hashObj, (err) => {
				if(err) {
					return this.swarm('interaction', 'handleError', err, 'Failed to save hashObj');
				}
				this.swarm('interaction', 'printInfo', 'All CSBs have been restored.');
			});
		});
		this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, "checkCSBStatus", "Failed to load RawCSB"));
	},

	checkCSBStatus: function (rawCSB) {
		console.log("Check CSB status");
		const meta = rawCSB.getAsset('global.CSBMeta', 'meta');
		if(meta.master){
			this.saveDseed(rawCSB);
		}else{
			this.createMasterCSB(rawCSB);
		}
	},

	saveDseed: function (rawCSB) {
		this.dseedCage.saveDseed(flowsUtils.defaultPin, this.dseed, validator.reportOrContinue(this, "collectFiles", "Failed to save dseed", rawCSB, this.dseed, '', 'master'));
	},

	createMasterCSB: function (rawCSB) {
		const seed = Seed.generateCompactForm(Seed.create(this.backupUrls || flowsUtils.defaultBackup));
		const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.swarm("interaction", "printSensitiveInfo", seed, flowsUtils.defaultPin);
		this.rootCSB = RootCSB.createNew(localFolder, dseed);
		this.dseedCage.saveDseed(flowsUtils.defaultPin, dseed, validator.reportOrContinue(this, "attachCSB", "Failed to save master dseed ", rawCSB));
	},

	attachCSB: function (rawCSB) {
		this.__attachCSB(this.rootCSB, defaultCSBAlias, this.seed, this.dseed, validator.reportOrContinue(this, 'saveRawCSB', '', rawCSB));

	},

	saveRawCSB: function (rawCSB) {
		this.rootCSB.saveRawCSB(rawCSB, defaultCSBAlias, validator.reportOrContinue(this, "collectFiles", "Failed to save CSB", rawCSB, this.dseed, defaultCSBAlias, defaultCSBAlias));
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

	},

	__attachCSB: function (rootCSB, alias, seed, dseed, callback) {
		rootCSB.loadAssetFromPath(alias, (err, csbRef)=>{
			if(err){
				return callback(err);
			}
			csbRef.init(alias, seed, dseed);
			rootCSB.saveAssetToPath(alias, csbRef, callback);

		})
	}

});

