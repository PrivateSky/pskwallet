var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("addCsb", {
	start: function (aliasCsb) {
		utils.requirePin(aliasCsb, null, this.addCsb);
	},
	addCsb: function (pin, aliasCsb) {
		var csbData   = utils.defaultCSB();
		var seed      = crypto.generateSeed(utils.defaultBackup);
		var masterCsb = utils.readMasterCsb(pin);
		var pathCsb   = crypto.generateSafeUid(crypto.deriveSeed(seed));
		if(utils.indexOfRecord(masterCsb.data, "Csb", aliasCsb) >= 0){
			console.log("A csb with the provided alias already exists");
			return;
		}
		if(!masterCsb.data["records"]) {
			masterCsb.data["records"] = {};
		}
		if(!masterCsb.data["records"]["Csb"]){
			masterCsb.data["records"]["Csb"] = []
		}
		var record = {
			"Title": aliasCsb,
			"Path" : pathCsb,
			"Seed" : seed.toString("hex"),
			"Dseed": crypto.deriveSeed(seed).toString("hex")
		};
		masterCsb.data["records"]["Csb"].push(record);
		utils.writeCsbToFile(masterCsb.path, masterCsb.data, masterCsb.dseed);
		var dseed = crypto.deriveSeed(seed);
		utils.writeCsbToFile(pathCsb, csbData, dseed);
		console.log(aliasCsb, "has been successfully created");
	}
});
