const path = require("path");
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const Seed = require('../../utils/Seed');
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const HashCage  = require('../../utils/HashCage');
const AsyncDispatcher = require("../../utils/AsyncDispatcher");

const localFolder = process.cwd();
$$.swarm.describe("extractFile", {
	start: function (url) {
		const {CSBPath, alias} = utils.processUrl(url, 'global.FileReference');
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.swarm("interaction", "readPin", flowsUtils.noTries);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, "loadFileAsset", pin, noTries);
	},

	loadFileAsset: function () {
		console.log("load asset");
		this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, "decryptFile", "Failed to load file asset " + this.alias));
	},
	
	decryptFile: function (fileReference, rawCSB) {
		console.log("File reference", fileReference);
		const filePath = utils.generatePath(localFolder, Buffer.from(fileReference.dseed));
		console.log("File path", filePath);
		crypto.decryptStream(filePath, localFolder, Buffer.from(fileReference.dseed), (err) => {
			if(err){
				return this.swarm("interaction", "handleError", err, "Failed to decrypt file" + filePath);
			}

			this.swarm("interaction", "printInfo", this.alias + " was successfully extracted. ");
		})
	}
});