var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.swarm.describe("setPin", {
	start: function () {
		this.swarm("interaction", "enterOldPin", 3);
	},
	enterOldPin: "interaction",

	validatePin: function (oldPin, noTries) {
		var self = this;
		utils.checkPinIsValid(oldPin, function (err) {
			if(err){
				console.log("Invalid pin");
				console.log("Try again");
				self.swarm("interaction", "enterOldPin", oldPin, noTries-1);
			}else {
				self.swarm("interaction", "enterNewPin", oldPin);
			}
		})
	},
	enterNewPin: "interaction",

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