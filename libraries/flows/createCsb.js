var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.flow.describe("createCsb", {
	start: function (aliasCsb) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.createCsb(pin, aliasCsb);
		});
	},
	createCsb: function (pin, aliasCsb) {
		var csbData   = utils.defaultCSB();
		var seed      = crypto.generateSeed(utils.defaultBackup);
		var masterCsb = utils.readMasterCsb(pin);
		var pathCsb   = crypto.generateSafeUid(crypto.deriveSeed(seed));
		if(utils.indexOfRecord(masterCsb.Data, "Csb", aliasCsb) >= 0){
			console.log("A csb with the provided alias already exists");
			return;
		}
		if(!masterCsb.Data["records"]) {
			masterCsb.Data["records"] = {};
		}
		if(!masterCsb.Data["records"]["Csb"]){
			masterCsb.Data["records"]["Csb"] = []
		}
		var record = {
			"Title": aliasCsb,
			"Path" : pathCsb,
			"Seed" : seed.toString("hex"),
			"Dseed": crypto.deriveSeed(seed).toString("hex")
		};
		masterCsb.Data["records"]["Csb"].push(record);
		utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed);
		var dseed = crypto.deriveSeed(seed);
		utils.writeCsbToFile(pathCsb, csbData, dseed);
		console.log(aliasCsb, "has been successfully created");
	}
});
