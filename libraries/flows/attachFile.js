const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const path = require('path');
const validator = require("../../utils/validator");
const Seed = require('../../utils/Seed');
const DseedCage = require('../../utils/DseedCage');
const HashCage  = require('../../utils/HashCage');
const localFolder = process.cwd();
$$.swarm.describe("attachFile", { //url: CSB1/CSB2/aliasFile
	start: function (url, filePath) { //csb1:assetType:alias
		const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.filePath = filePath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, 'loadFileReference', pin, noTries);
	},

	loadFileReference: function(pin){
		this.pin = pin;
		this.rootCSB.loadMasterRawCSB(validator.reportOrContinue(this, 'loadAsset', 'Failed to load masterCSB.'));
	},

	loadAsset: function(){
		this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, 'saveFileToDisk', 'Failed to load asset'));

	},

	saveFileToDisk: function(FileReference){
		if (FileReference.isPersisted()) {
			this.swarm("interaction", "handleError", new Error("File is persisted"), "A file with the same alias already exists ");
			return;
		}

		const seed = Seed.generateCompactForm(Seed.create(flowsUtils.defaultBackup));
		const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.fileID = utils.generatePath(localFolder, dseed);

		crypto.encryptStream(this.filePath, this.fileID, dseed, validator.reportOrContinue(this, 'saveFileReference', "Failed at file encryption.", FileReference, seed, dseed));

	},


	saveFileReference: function(FileReference, seed, dseed){
		FileReference.init(this.alias, seed, dseed);
		this.rootCSB.saveAssetToPath(this.CSBPath, FileReference, validator.reportOrContinue(this, 'computeHash', "Failed to save file", this.fileID));
	},

	computeHash: function () {
		const fileStream = fs.createReadStream(this.fileID);
		crypto.pskHashStream(fileStream, validator.reportOrContinue(this, "loadHashObj", "Failed to compute hash"));
	},

	loadHashObj: function (digest) {
		this.hashCage = new HashCage(localFolder);
		this.hashCage.loadHash(validator.reportOrContinue(this, "addToHashObj", "Failed to load hashObj", digest));
	},

	addToHashObj: function (hashObj, digest) {
		hashObj[path.basename(this.fileID)] = digest.toString("hex");
		this.hashCage.saveHash(hashObj, validator.reportOrContinue(this, "printSuccess", "Failed to save hashObj"));
	},

	printSuccess: function(){
		this.swarm("interaction", "printInfo", this.filePath + " has been successfully added to " + this.CSBPath);
	}
});