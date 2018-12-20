const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
const fs = require("fs");

$$.swarm.describe("createCsb", {
	start: function (aliasCsb) {
		var self = this;
		self.aliasCsb = aliasCsb;
		utils.masterCsbExists(function (err, status) {
			if(err){
				self.swarm("interaction", "readPin", utils.noTries, utils.defaultPin, true);
			}else{
				self.swarm("interaction", "readPin", utils.noTries);
			}
		});
	},
	
	createMasterCsb: function(pin, pathMaster) {
		var self = this;
		pin = pin || utils.defaultPin;
		fs.mkdir(utils.Paths.auxFolder, function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to create .privateSky folder");
			}else {
				var seed = crypto.generateSeed(utils.defaultBackup);
				var dseed = crypto.deriveSeed(seed);
				self.swarm("interaction", "printSensitiveInfo", seed, utils.defaultPin);
				pathMaster = pathMaster || utils.getMasterPath(dseed);
				crypto.saveDSeed(dseed, pin, utils.Paths.Dseed, function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to save dseed");
						return;
					}
					var masterCsb = utils.defaultCSB();
					utils.writeCsbToFile(pathMaster, masterCsb, dseed, function (err) {
						if (err) {
							self.swarm("interaction", "handleError", err, "Failed to write master csb");
							return;
						}
						self.swarm("interaction", "printInfo", "Master csb has been created");
						self.createCsb(pin);

					})

				});
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
				var error = new Error("csb_exists");
				self.swarm("interaction", "handleError", error, "Failed to write csb" + self.aliasCsb);
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
					self.swarm("interaction", "printInfo", {status:"success", title:self.aliasCsb, path:pathCsb});
				});

			});

		});
	}
});
