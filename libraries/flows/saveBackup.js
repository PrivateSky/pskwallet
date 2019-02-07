const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const Seed = require('../../utils/Seed');
const validator = require("../../utils/validator");
const HashCage  = require('../../utils/HashCage');
const AsyncDispatcher = require("../../utils/AsyncDispatcher");

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
		fs.readFile(this.masterID, validator.reportOrContinue(this, 'createRootCSB', 'Failed to read masterCSB.'));
	},


	createRootCSB: function () {
		this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, "dispatcher", "Failed to load masterCSB"));
	},
	dispatcher: function(rawCSB) {
		this.asyncDispatcher = new AsyncDispatcher((errors, results) => {
			if(errors.length > 0) {
				this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect all CSBs');
				return;
			}
			this.collectFiles(results);
		});

		this.asyncDispatcher.dispatch(() => {
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
						this.asyncDispatcher.dispatch(() => {
							this.collectCSBs(...args);
						});
					});
					this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, dseed, alias});
				}
			});
		});

		if(listCSBs.length === 0) {
			this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, dseed, alias});
		}
	},
	collectFiles: function(collectedCSBs){
		this.asyncDispatcher = new AsyncDispatcher((errors, newResults) => {
			if(errors.length > 0) {
				this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect files attached to CSBs');
			}
			this.__categorize(collectedCSBs.concat(newResults));
		});

		this.asyncDispatcher.emptyDispatch(collectedCSBs.length);
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

		this.asyncDispatcher = new AsyncDispatcher((errors, successes) => {
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
		this.asyncDispatcher.emptyDispatch();
		$$.remote.doHttpPost(backupURL + "/CSB/compareVersions", JSON.stringify(filesToUpdate), (err, modifiedFiles) => {
			if(err) {
				this.asyncDispatcher.markOneAsFinished(new Error('Failed to connect to ' + backupURL));
				return;
			}
			this.__backupFiles(JSON.parse(modifiedFiles), backupURL, filesNames);
		});
	},

	__backupFiles: function (files, backupAddress, aliases) {
		this.asyncDispatcher.emptyDispatch(files.length);
		files.forEach(file => {
			const fileStream = fs.createReadStream(file);
			const backupURL = backupAddress + '/CSB/' + file;
			$$.remote.doHttpPost(backupURL, fileStream, (err, res) => {
				if (err) {
					return this.asyncDispatcher.markOneAsFinished({alias: aliases[file], backupURL: backupURL});
				}

				this.asyncDispatcher.markOneAsFinished(undefined, {alias: aliases[file], backupURL: backupURL});
			});
		});

		this.asyncDispatcher.markOneAsFinished(); // for http request to compareVersions
	},

	__collectFiles: function (rawCSB, csbAlias) {
		const files = rawCSB.getAllAssets('global.FileReference');
		this.asyncDispatcher.emptyDispatch(files.length);
		files.forEach(FileReference => {
			const alias = FileReference.alias;
			const dseed = Buffer.from(FileReference.dseed);
			this.asyncDispatcher.markOneAsFinished(undefined, {dseed, alias})
		});
		this.asyncDispatcher.markOneAsFinished();
	}
});

