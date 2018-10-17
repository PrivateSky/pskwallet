var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
const getPassword = require("../utils/getPassword");
$$.flow.describe("resetPin", {
	start: function () {
		var self = this;
		utils.enterSeed(function (err, seed) {
			self.enterPin(seed);
		});
	},
	enterPin: function (seed) {
		var self = this;
		getPassword("Enter a new pin:", function(err, answer){
			if(err){
				console.log("You introduced an invalid character. Please try again.")
				self.enterPin(seed);
			}else {
				self.updateData(seed, answer, function (err) {
					if(err){
						throw err;}
				});
			}
		});
	},
	updateData: function (seed, pin, callback) {
		utils.loadMasterCsb(null, seed, function (err, masterCsb) {
			utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed, function (err) {
				if(err){
					return callback(err);
				}
				crypto.saveDSeed(masterCsb.Dseed, pin, utils.Paths.Dseed, function (err) {
					if(err){
						return callback(err);
					}
					console.log("Pin has been changed");
				});
			});
		});

	}
});