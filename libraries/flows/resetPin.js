var path = require("path");
const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
const fs = require("fs");

$$.swarm.describe("resetPin", {
	start: function () {
		this.swarm("interaction", "readSeed", 3);
	},

	checkSeedValidity: function (seed) {
		var self = this;
		self.seed = seed;
		fs.access(utils.Paths.auxFolder, function (err) {
			if(err){
				fs.mkdir(utils.Paths.auxFolder, function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to create .privateSky folder");
						return;
					}
					self.swarm("interaction", "readPin");
				})
			}else{
				utils.checkSeedIsValid(seed, function (err, status) {
					if(err) {
						self.swarm("interaction", "handleError", null, "Seed is invalid", true);
					}else{
						self.swarm("interaction", "readPin");
					}
				})
			}
		});


	},

	updateData: function (pin) {
		var self = this;
		crypto.saveDSeed(crypto.deriveSeed(Buffer.from(this.seed, "base64")), pin, utils.Paths.Dseed, function (err) {
			if(err){
				self.swarm("interaction", "printInfo", err, "Failed to save dseed");
				return;
			}
			self.swarm("interaction", "printInfo","The pin has been successfully changed");
		});
	}
});