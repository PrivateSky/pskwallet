var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
const fs = require("fs");

$$.swarm.describe("resetPin", {
	start: function () {
		this.swarm("interaction", "readSeed", 3);
	},
	readSeed: "interaction",

	checkSeedValidity: function (seed) {
		var self = this;
		self.seed = seed;
		fs.access(utils.Paths.auxFolder, function (err) {
			if(err){
				fs.mkdir(utils.Paths.auxFolder, function (err) {
					if(err){
						throw err;
					}
					self.swarm("interaction", "readPin");
				})
			}else{
				utils.checkSeedIsValid(seed, function (err, status) {
					if(err) {
						console.log("Seed is; invalid");
					}else{
						self.swarm("interaction", "readPin");
					}
				})
			}
		});


	},
	readPin: "interaction",

	updateData: function (pin) {
		crypto.saveDSeed(crypto.deriveSeed(Buffer.from(this.seed, "base64")), pin, utils.Paths.Dseed, function (err) {
			if(err){
				throw err;
			}
			console.log("Pin has been changed");
		});
	}
});