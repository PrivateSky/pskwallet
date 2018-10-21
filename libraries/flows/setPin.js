var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.swarm.describe("setPin", {
	start: function () {
		this.swarm("interaction", "enterOldPin", null);
	},
	enterOldPin: "interaction",

	requestNewPin: function (oldPin, callback) {
		this.swarm("interaction", "enterNewPin", oldPin);
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