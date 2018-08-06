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
		var dseed = crypto.loadDseed(oldPin, utils.Paths.Dseed);
		crypto.saveDSeed(dseed, newPin, utils.Paths.Dseed);
		console.log("The pin has been changed");
	}
});