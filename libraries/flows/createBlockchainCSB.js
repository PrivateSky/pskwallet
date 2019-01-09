const utils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
$$.swarm.describe("createBlockchainCSB", {
	start: function (aliasCSB) {
		this.aliasCSB = aliasCSB;
		utils.masterCsbExists( (err, status) => {
			if(err){
				this.swarm("interaction", "readPin", utils.noTries, utils.defaultPin, true);
			}else{
				this.swarm("interaction", "readPin", utils.noTries);
			}
		});
	},

	createMasterCsb: function(pin) {
		pin = pin || utils.defaultPin;
		const seed = Seed.generateCompactForm(Seed.create(utils.defaultBackup));
		const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.rootCSB = require("../RootCSB").createRootCSB(process.cwd(), null, null, dseed, );
		self.swarm("interaction", "printSensitiveInfo", seed, utils.defaultPin);

		crypto.saveData(dseed, pin, utils.Paths.Dseed, function (err) {
			if (err) {
				self.swarm("interaction", "handleError", err, "Failed to save dseed");
				return;
			}


		});
	},

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
				self.swarm("interaction", "handleError", null, "Failed to write csb" + self.aliasCsb);
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
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to write master csb");
					return;
				}
				var dseed = crypto.deriveSeed(seed);
				utils.writeCsbToFile(pathCsb, csbData, dseed, function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to write csb" + self.aliasCsb);
						return;
					}
					self.swarm("interaction", "printInfo", "Csb " + self.aliasCsb + " was successfully created.");
				});

			});

		});
	}
});
