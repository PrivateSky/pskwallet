var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
const passReader = require(path.resolve(__dirname + "/../utils/passwordReader"));
$$.flow.describe("resetPin", {
	start: function () {
		utils.enterSeed(this.enterPin);
	},
	enterPin: function (seed) {
		passReader.getPassword("Enter a new pin:", function(err, answer){
			if(err){
				console.log("You introduced an invalid character. Please try again.")
				this.enterPin(seed);
			}else {
				this.updateData(seed, answer);
			}
		});
	},
	updateData: function (seed, pin) {
		var masterCsb = utils.readMasterCsb(null, seed);
		utils.writeCsbToFile(masterCsb.path, masterCsb.csbData, masterCsb.dseed);
		crypto.saveDSeed(masterCsb.dseed, pin, utils.paths.dseed);
		console.log("Pin has been changed");
	}
});