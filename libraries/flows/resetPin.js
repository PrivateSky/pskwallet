var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
require("interact").initConsoleMode();
$$.flow.describe("resetPin", {
	start: function () {
		var self = this;
		utils.enterSeed(function (err, seed) {
			self.enterPin(seed);
		});
	},
	enterPin: function (seed) {
		var self = this;
		$$.interact.readPassword("Enter a new pin:", function(err, answer){
			if(err){
				$$.interact.say("You introduced an invalid character. Please try again.")
				self.enterPin(seed);
			}else {
				self.updateData(seed, answer);
			}
		});
	},
	updateData: function (seed, pin) {
		var masterCsb = utils.loadMasterCsb(null, seed);
		utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed);
		crypto.saveDSeed(masterCsb.Dseed, pin, utils.Paths.Dseed);
		$$.interact.say("Pin has been changed");
	}
});