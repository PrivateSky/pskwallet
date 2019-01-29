const path = require("path");
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const Seed = require('../../utils/Seed');
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const HashCage  = require('../../utils/HashCage');
const localFolder = process.cwd();

$$.swarm.describe("saveBackup", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, "loadHashFile", pin, noTries);
	},
	loadHashFile: function() {
		this.hashCage = new HashCage(localFolder);
		this.hashCage.loadHash(validator.reportOrContinue(this, 'readEncryptedMaster', 'Failed to load hash file'));
	},
	readEncryptedMaster: function(hashFile){
		this.hashFile = hashFile;
		this.masterID = utils.generatePath(localFolder, this.dseed);
		fs.readFile(this.masterID, validator.reportOrContinue(this, 'loadMaster', 'Failed to read masterCSB.'));
	},


	loadMaster: function () {
		this.rootCSB.loadMasterRawCSB(validator.reportOrContinue(this, "dispatcher", "Failed to load masterCSB"));
	},
	dispatcher: function(rawCSB) {
		this.asyncQueue = new AsyncQueue((errors, results) => {
			if(errors.length > 0) {
				this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect all CSBs');
				return;
			}
			this.collectFiles(results);
		});

		this.asyncQueue.dispatch(() => {
			this.collectCSBs(rawCSB, this.dseed, '', 'master');
		});
	},

	collectCSBs: function (rawCSB, dseed, currentPath, alias) {
		const listCSBs = rawCSB.getAllAssets('global.CSBReference');
		const nextArguments = [];
		let counter = 0;

		listCSBs.forEach(CSBReference => {
			const nextPath = currentPath + '/' + CSBReference.alias;
			const nextDseed = Buffer.from(CSBReference.dseed);
			const nextAlias = CSBReference.alias;
			this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

				nextArguments.push([nextRawCSB, nextDseed, nextPath, nextAlias]);
				if (++counter === listCSBs.length) {
					nextArguments.forEach(args => {
						this.asyncQueue.dispatch(() => {
							this.collectCSBs(...args);
						});
					});
					this.asyncQueue.markOneAsFinished(undefined, {rawCSB, dseed, alias});
				}
			});
		});

		if(listCSBs.length === 0) {
			this.asyncQueue.markOneAsFinished(undefined, {rawCSB, dseed, alias});
		}
	},
	collectFiles: function(collectedCSBs){
		this.asyncQueue = new AsyncQueue((errors, newResults) => {
			if(errors.length > 0) {
				this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect files attached to CSBs');
			}

			this.__categorize(collectedCSBs.concat(newResults));
		});

		collectedCSBs.forEach(({rawCSB, dseed, alias}) => {
			this.__collectFiles(rawCSB, alias);
		});

	},

	__categorize: function(files) {
		const categories = {};
		files.forEach(({dseed, alias}) => {
			const backups = Seed.getBackupUrls(dseed);
			backups.forEach((backup) =>{
				if(!categories[backup]) {
					categories[backup] = {};
				}
				categories[backup][crypto.generateSafeUid(dseed)] = alias;
			})
		});

		this.asyncQueue = new AsyncQueue((errors, successes) => {
			this.swarm('interaction', 'csbBackupReport', {errors, successes});
		});


		Object.entries(categories).forEach(([backupURL, filesNames]) => {
			this.filterFiles(backupURL, filesNames);
		});
	},

	filterFiles: function(backupURL, filesNames){
		let filesToUpdate = {};
		Object.keys(this.hashFile).forEach(fileName => {
			if(filesNames[fileName]) {
				filesToUpdate[fileName] = this.hashFile[fileName];
			}
		});
		this.asyncQueue.emptyDispatch();
		$$.remote.doHttpPost(backupURL + "/CSB/compareVersions", JSON.stringify(filesToUpdate), (err, modifiedFiles) => {
			if(err) {
				this.asyncQueue.markOneAsFinished(new Error('Failed to connect to ' + backupURL));
				return;
			}
			this.__backupFiles(JSON.parse(modifiedFiles), backupURL, filesNames);
		});
	},

	__backupFiles: function (files, backupAddress, aliases) {
		files.forEach(file => {
			const fileStream = fs.createReadStream(file);
			this.asyncQueue.dispatch((callback) => {
				const backupURL = backupAddress + '/CSB/' + file;
				$$.remote.doHttpPost(backupURL, fileStream, (err, res) => {
					if (err) {
						return callback({alias: aliases[file], backupURL: backupURL});
					}

					callback(undefined, {alias: aliases[file], backupURL: backupURL});
				});
			});
		});
		this.asyncQueue.markOneAsFinished();
	},
	__collectFiles: function (rawCSB, csbAlias) {
		const files = rawCSB.getAllAssets('global.FileReference');

		files.forEach(FileReference => {
			const alias = FileReference.alias;
			const dseed = Buffer.from(FileReference.dseed);

			this.asyncQueue.dispatch((callback) => {
				callback(undefined, {dseed, alias});
			});
		});

	}
});


function AsyncQueue(finalCallback) {
	const results = [];
	const errors = [];

	let started = 0;

	function dispatch(fn) {
		++started;
		fn(function (err, res) {
			if(err) {
				errors.push(err);
			}

			if(arguments.length > 2) {
				arguments[0] = undefined;
				res = arguments;
			}

			if(typeof res !== "undefined") {
				results.push(res);
			}
			if(--started <= 0) {
				finalCallback(errors, results);
			}
		});
	}

	function markOneAsFinished(err, res) {
		if(err) {
			errors.push(err);
		}

		if(arguments.length > 2) {
			arguments[0] = undefined;
			res = arguments;
		}

		if(typeof res !== "undefined") {
			results.push(res);
		}

		if(--started <= 0) {
			finalCallback(errors, results);
		}
	}

	function emptyDispatch() {
		++started;
	}

	return {
		dispatch,
		emptyDispatch,
		markOneAsFinished
	}
}
