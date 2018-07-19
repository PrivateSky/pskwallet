var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require(path.resolve(__dirname + "/../../../pskcrypto/cryptography"));
$$.flow.describe("addCsb", {
	start: function (aliasCsb) {
		utils.requirePin(aliasCsb, this.addCsb);
	},
	addCsb: function (pin, aliasCsb) {
		var csbData   = utils.defaultCSB();
		var seed      = crypto.generateSeed();
		var masterCsb = utils.readMasterCsb(pin);
		var pathCsb   = utils.generateCsbId(seed);
		if(utils.checkAliasExists(masterCsb, aliasCsb)){
			throw new Error("A csb with the provided alias already exists");
		}
		if(!masterCsb.csbData["records"]) {
			masterCsb.csbData["records"] = {};
		}
		if(!masterCsb.csbData["records"]["Csb"]){
			masterCsb.csbData["records"]["Csb"] = []
		}
		var record = {
			"Alias": aliasCsb,
			"Path" : pathCsb,
			"Seed" : seed.toString("hex"),
			"Dseed": crypto.deriveSeed(seed)
		};
		masterCsb.csbData["records"]["Csb"].push(record);
		utils.writeCsbToFile(utils.paths.masterCsb, masterCsb.csbData, masterCsb.dseed);
		var dseed = crypto.deriveSeed(seed);
		utils.writeCsbToFile(pathCsb, csbData, dseed);
	}
});
