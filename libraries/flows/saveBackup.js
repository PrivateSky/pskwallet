const path = require("path");
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const Seed = require('../../utils/Seed');
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const localFolder = process.cwd();

$$.swarm.describe("saveBackup", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, "readEncryptedMaster", pin, noTries);
	},


	readEncryptedMaster: function(){
		this.masterID = utils.generatePath(localFolder, this.dseed);
		fs.readFile(this.masterID, validator.reportOrContinue(this, 'backupMaster', 'Failed to read masterCSB.'));
	},

	backupMaster: function(encryptedMasterCSB){
		validator.reportOrContinue(this, 'loadMaster', 'Failed to post masterCSB')();
	},

	loadMaster: function () {
		this.rootCSB.loadMasterRawCSB(validator.reportOrContinue(this, "collectCSBs", "Failed to load masterCSB", this.dseed, '', 'master'));
	},


	collectCSBs: function (rawCSB, dseed, currentPath, alias) {
		const listCSBs = rawCSB.getAllAssets('global.CSBReference');
		const nextArguments = [];
		let counter = 0;

		if (listCSBs && listCSBs.length > 0) {
			listCSBs.forEach(CSBReference => {
				const nextPath = currentPath + '/' + CSBReference.alias;
				const nextDseed = Buffer.from(CSBReference.dseed);
				const nextAlias = CSBReference.alias;
				this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

					if (err) {
						throw err;
					}

					nextArguments.push([nextRawCSB, nextDseed, nextPath, nextAlias]);

					if (++counter === listCSBs.length) {
						nextArguments.forEach(args => {
							this.collectCSBs(...args);
						});
					}
				});
			});
		}

		this.backupCSB(rawCSB, dseed, alias);
	},
	backupCSB: function(rawCSB, dseed, alias) {
		const csbDiskPath = utils.generatePath(localFolder, dseed);
		const csbStream = fs.createReadStream(csbDiskPath);

		this.backupStream(csbStream, dseed, alias, (err, {alias, backupURL}) => {
			if (err) {
				return this.swarm('interaction', 'handleError', err);
			}

			this.backupFiles(rawCSB, alias, (errors, successes) => {
				this.swarm('interaction', 'csbBackupReport', {fileErrors: errors, fileSuccesses: successes, csbBackupURL: backupURL, csbAlias: alias});
			});
		});
	},
	backupStream: function(stream, dseed, alias, callback) {
		stream.on('error', callback);

		let readStart = false;

		stream.on('readable', () => {
			if(readStart) {
				return;
			}

			readStart = true;
			const dseedObj  = Seed.load(dseed);
			const backups   = dseedObj.backup;
			const backupUid = crypto.generateSafeUid(dseed, '');
			let counter     = 0;

			const failedRequestsMessages = [];

			backups.forEach(backup => {
				const backupURL = backup + "/CSB/" + backupUid;
				$$.remote.doHttpPost(backup + "/CSB/" + backupUid, stream, (err) => {
					counter++;
					if (err) {
						failedRequestsMessages.push({alias, backupURL});
						return;
					}

					if (counter === backups.length) {
						if (failedRequestsMessages.length > 0) {
							return callback(failedRequestsMessages);
						}

						callback(undefined, {alias, backupURL});
					}
				});
			});
		});
	},

	backupFiles: function (rawCSB, csbAlias, callback) {
		const files = rawCSB.getAllAssets('global.FileReference');

		let counter = 0;
		const errors = [];
		const successes = [];

		if (files.length === 0) {
			callback(errors, successes);
		} else {
			files.forEach(FileReference => {
				const alias = FileReference.alias;
				const dseed = Buffer.from(FileReference.dseed);
				const fileDiskPath = utils.generatePath(localFolder, dseed);
				const fileStream = fs.createReadStream(fileDiskPath);

				this.backupStream(fileStream, dseed, alias, (err, successInfo) => {
					counter++;
					if (err) {
						err.csbAlias = csbAlias;
						errors.push(err);
					} else {
						successInfo.csbAlias = csbAlias;
						successes.push(successInfo);
					}

					if (counter === files.length) {
						callback(errors, successes);
					}
				});
			});
		}
	}
});
