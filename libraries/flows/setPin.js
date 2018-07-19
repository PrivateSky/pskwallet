var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require(path.resolve(__dirname + "/../../../pskcrypto/cryptography"));
$$.flow.describe("setPin", {
	start: function (newPin) {
		utils.requirePin(newPin, this.actualizePin);
	},
	actualizePin: function (oldPin, newPin) {
		var masterCsb = utils.readMasterCsb(oldPin);
		crypto.encryptDSeed(masterCsb.dseed, newPin, utils.paths.dseed);
		utils.writeCsbToFile(utils.paths.masterCsb, masterCsb.csbData, masterCsb.dseed);
	}
});