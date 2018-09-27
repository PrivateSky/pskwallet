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
		utils.loadMasterCsb(pin, null, function (err, masterCsb) {
			var pathCsb   = crypto.generateSafeUid(crypto.deriveSeed(seed));
			console.log("-----------------------MasterCsb");
			console.log(masterCsb);
			if(utils.indexOfRecord(masterCsb.Data, "Csb", aliasCsb) >= 0){
				$$.interact.say("A csb with the provided alias already exists");
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
			utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed, function (err) {
				var dseed = crypto.deriveSeed(seed);
				utils.writeCsbToFile(pathCsb, csbData, dseed, function (err) {
					$$.interact.say(aliasCsb, "has been successfully created");
				});

			});

		});

	}
});
