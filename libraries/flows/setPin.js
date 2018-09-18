var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const passReader = require(path.resolve(__dirname + "/../utils/passwordReader"));
const crypto = require("pskcrypto");
$$.flow.describe("setPin", {
	start: function () {
		var self = this;
		utils.requirePin("Enter old pin:", function (err, oldPin) {
			self.enterNewPin(oldPin);
		});
	},
	enterNewPin: function (oldPin) {
		oldPin = oldPin || utils.defaultPin;
		var self = this;
		passReader.getPassword("Insert new pin:", function(err, newPin){
			if(err){
				console.log("An invalid character was introduced. Try again:")
				self.enterNewPin(oldPin);
			}else{
				self.actualizePin(oldPin, newPin);
			}
		});
	},
	actualizePin: function (oldPin, newPin) {
		oldPin = oldPin || utils.defaultPin;
		var dseed = crypto.loadDseed(oldPin, utils.Paths.Dseed);
		crypto.saveDSeed(dseed, newPin, utils.Paths.Dseed);
		console.log("The pin has been changed");
	}
});