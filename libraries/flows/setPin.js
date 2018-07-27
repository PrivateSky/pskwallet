var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const passReader = require(path.resolve(__dirname + "/../utils/passwordReader"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("setPin", {
	start: function () {
		utils.requirePin(null, "Enter old pin:", this.enterNewPin);
	},
	enterNewPin: function (oldPin) {
		var self = this;
		passReader.getPassword("Insert new pin:", function(err, newPin){
			if(err){
				console.log("An invalid character was introduced. Try again:")
				this.enterNewPin(oldPin);
			}else{
				self.actualizePin(oldPin, newPin);
			}
		});
	},
	actualizePin: function (oldPin, newPin) {
		var masterCsb = utils.readMasterCsb(oldPin);
		crypto.saveDSeed(masterCsb.dseed, newPin, utils.paths.dseed);
		utils.writeCsbToFile(masterCsb.path, masterCsb.csbData, masterCsb.dseed);
		console.log("The pin has been changed");
	}
});