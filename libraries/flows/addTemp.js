const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const validator = require("../../utils/validator");
const Seed = require('../../utils/Seed');

$$.swarm.describe("addTemp", { //url: CSB1/CSB2/aliasFile
	start: function (url, filePath) { //csb1:assetType:alias
		const {CSBPath, alias} = this.__processUrl(url);
		console.log("CSBPath:", CSBPath, alias);
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.filePath = filePath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(process.cwd(), this, 'loadFileReference', pin, noTries);
	},

	loadFileReference: function(pin){
		this.pin = pin;
		this.rootCSB.loadMasterRawCSB((err) => {
			if(err) {
				console.log(err, ' nu azi');
				return;
			}
			this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, 'saveFileToDisk', 'Failed to load asset'));
		});
	},

	saveFileToDisk: function(file){
		if (file.isPersisted()) {
			this.swarm("interaction", "handleError", new Error("File is persisted"), "A file with the same alias already exists ");
			return;
		}

		const seed = Seed.generateCompactForm(Seed.create(flowsUtils.defaultBackup));
		const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		const fileID = utils.generatePath(process.cwd(), dseed);

		crypto.encryptStream(this.filePath, fileID, dseed, validator.reportOrContinue(this, 'saveFileReference', "Failed at file encryption.",file, seed, dseed));

	},

	saveFileReference: function(file, seed, dseed){
		file.init(this.alias, seed, dseed);
		this.rootCSB.saveAssetToPath(this.CSBPath, file, validator.reportOrContinue(this, 'printSuccess', "Failed to save file"));
	},

	printSuccess: function(){
		this.swarm("interaction", "printInfo", this.filePath + " has been successfully added to " + this.CSBPath);
	},

	__processUrl: function (url) {
		let splitUrl = url.split('/');
		const aliasAsset = splitUrl.pop();
		let CSBPath = splitUrl.join('/');
		return {
			CSBPath: CSBPath + ':FileReference:' + aliasAsset,
			alias: aliasAsset
		};
	}
});