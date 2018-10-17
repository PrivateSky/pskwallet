var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const getPassword = require("../utils/getPassword");const crypto = require("pskcrypto");
$$.flow.describe("setPin", {
	start: function () {
		var self = this;
		utils.requirePin("Enter old pin:", function (err, oldPin) {
			self.enterNewPin(oldPin, function (err) {
				if(err){
					throw err;
				}
			});
		});
	},
	enterNewPin: function (oldPin, callback) {
		oldPin = oldPin || utils.defaultPin;
		var self = this;
		getPassword("Insert new pin:", function(err, newPin){
			if(err){
				console.log("An invalid character was introduced. Try again:")
				self.enterNewPin(oldPin, callback);
			}else{
				self.actualizePin(oldPin, newPin, callback);
			}
		});
	},
	actualizePin: function (oldPin, newPin, callback) {
		oldPin = oldPin || utils.defaultPin;
		crypto.loadDseed(oldPin, utils.Paths.Dseed, function (err, dseed) {
			if(err){
				callback(err);
				return;
			}
			crypto.saveDSeed(dseed, newPin, utils.Paths.Dseed, function (err) {
				if(err){
					return callback(err);
				}else{
					console.log("The pin has been changed");
				}
			});
		});
	}
});