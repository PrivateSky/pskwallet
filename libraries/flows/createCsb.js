var path = require("path");

const utils = require(path.resolve(__dirname + "/../../utils/flowsUtils"));
const crypto = require("pskcrypto");
$$.swarm.describe("createCsb", {
	start: function (aliasCsb) {
		var self = this;
		self.aliasCsb = aliasCsb;
		utils.masterCsbExists(function (err, status) {
			if(err){
				utils.createMasterCsb(null, null, function (err) {
					if(err){
						throw err;
					}
					self.createCsb(null, aliasCsb);
				});
			}else{
				self.swarm("interaction", "readPin", 3);
			}
		});
	},
	readPin:"interaction",

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.createCsb(pin);
			}
		})
	},

	createCsb: function (pin) {
		var self = this;
		var csbData   = utils.defaultCSB();
		var seed      = crypto.generateSeed(utils.defaultBackup);
		utils.loadMasterCsb(pin, null, function (err, masterCsb) {
			var pathCsb   = crypto.generateSafeUid(crypto.deriveSeed(seed));
			if(utils.indexOfRecord(masterCsb.Data, "Csb", self.aliasCsb) >= 0){
				return;
			}
			if(!masterCsb.Data["records"]) {
				masterCsb.Data["records"] = {};
			}
			if(!masterCsb.Data["records"]["Csb"]){
				masterCsb.Data["records"]["Csb"] = []
			}
			var record = {
				"Title": self.aliasCsb,
				"Path" : pathCsb,
				"Seed" : seed.toString("hex"),
				"Dseed": crypto.deriveSeed(seed).toString("hex")
			};
			masterCsb.Data["records"]["Csb"].push(record);
			utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed, function (err) {
				var dseed = crypto.deriveSeed(seed);
				utils.writeCsbToFile(pathCsb, csbData, dseed, function (err) {
					console.log("Csb", self.aliasCsb, "was successfully created.");
				});

			});

		});

	}
});
