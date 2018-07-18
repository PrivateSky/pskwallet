var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require(path.resolve(__dirname + "/../../../pskcrypto/cryptography"));
const readline = require("readline");
$$.flow.describe("resetPin", {
	start: function () {
		this.enterSeed(this.enterPin);
	},
	enterSeed: function (callback) {
		const rl = readline.createInterface({
			input:  process.stdin,
			output: process.stdout
		});
		rl.question("Enter seed:", (answer) => {
			var seed = Buffer.from(answer, "hex");
			if(utils.checkSeedIsValid(seed)){
				rl.close();
				callback(seed);
			}else{
				throw new Error("Seed is invalid");
			}
		})
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
		crypto.encryptDSeed(masterCsb.dseed, pin, utils.paths.dseed);
		console.log("Pin was successfully changed");
	}
});