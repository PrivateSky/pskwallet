var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
const readline = require("readline");
$$.flow.describe("resetPin", {
	start: function () {
		utils.enterSeed(this.enterPin);
	},
	enterPin: function (seed) {
		const rl = readline.createInterface({
			input:  process.stdin,
			output: process.stdout
		});
		rl.question("Enter pin:", (answer) => {
			rl.close();
			this.updateData(seed, answer);
		});
	},
	updateData: function (seed, pin) {
		var masterCsb = utils.readMasterCsb(null, seed);
		utils.writeCsbToFile(utils.paths.masterCsb, masterCsb.csbData, masterCsb.dseed);
		crypto.saveDSeed(masterCsb.dseed, pin, utils.paths.dseed);
		console.log("Pin was successfully changed");
	}
});