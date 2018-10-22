var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.swarm.describe("createCsb", {
	start: function (aliasCsb) {
		var self = this;
		utils.masterCsbExists(function (err, status) {
			if(err){
				utils.createMasterCsb(null, null, function (err) {
					if(err){
						throw err;
					}
					self.createCsb(null, aliasCsb);
				});
			}else{
				self.swarm("interaction", "readPin", aliasCsb, 3);
			}
		});
	},
	readPin:"interaction",

	validatePin: function (pin, aliasCsb, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				console.log("Invalid pin");
				console.log("Try again");
				self.swarm("interaction", "readPin", aliasCsb, noTries-1);
			}else {
				self.createCsb(pin, aliasCsb);
			}
		})
	},

	createCsb: function (pin, aliasCsb) {
		var csbData   = utils.defaultCSB();
		var seed      = crypto.generateSeed(utils.defaultBackup);
		utils.loadMasterCsb(pin, null, function (err, masterCsb) {
			var pathCsb   = crypto.generateSafeUid(crypto.deriveSeed(seed));
			if(utils.indexOfRecord(masterCsb.Data, "Csb", aliasCsb) >= 0){
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
					console.log("Csb", aliasCsb, "was successfully created.");
				});

			});

		});

	}
});
