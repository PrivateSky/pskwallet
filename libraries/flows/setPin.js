var path = require("path");
const utils = require("./../../utils/flowsUtils");
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
				self.oldPin = oldPin;
				self.swarm("interaction", "enterNewPin");
			}
		})
	},
	enterNewPin: "interaction",
	actualizePin: function (newPin, callback) {
			crypto.loadData(this.oldPin, utils.Paths.Dseed, function (err, dseed) {
				if(err){
					callback(err);
					return;
				}
				crypto.saveData(dseed, newPin, utils.Paths.Dseed, function (err) {
					if(err){
						return callback(err);
					}else{
						console.log("The pin has been changed");
					}
				});
			});
	}
});