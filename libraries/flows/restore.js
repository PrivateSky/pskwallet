var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");
require('psk-http-client');

$$.flow.describe("restore", {
	start: function (aliasCsb) {
		var self = this;
		utils.masterCsbExists(function (err, status) {
			if(!err){
				utils.enterSeed(function (err, seed) {
					self.readMaster(seed, aliasCsb, function (err) {
						if(err){
							throw err;
						}
					});
				});
			}else{
				utils.enterSeed(function (err, seed) {
					self.restoreMaster(seed, aliasCsb, function (err) {
						if(err) {
							throw err;
						}
					});
				});
			}
		});
	},
	readMaster: function (seed, aliasCsb, callback) {
		var self = this;
		utils.loadMasterCsb(null, seed, function (err, masterCsb) {
			if(err){
				return callback(err);
			}
			self.__getCsbsToRestore(masterCsb.Data, aliasCsb, function (err, csbs) {
				if(err){
					return callback(err);
				}
				$$.interact.say(masterCsb.Data["backups"]);
				self.restoreCsbs(masterCsb.Data["backups"][0], csbs, 0, function (err) {
					if(err){
						callback(err);
					}
				});
			});

		});

	},
	restoreMaster: function (seed, aliasCsb, callback) {
		var obj = JSON.parse(seed.toString());
		var url = obj.backup;
		$$.interact.say(url);
		var self = this;
		$$.remote.doHttpGet(path.join(url,"CSB", utils.getMasterUid(crypto.deriveSeed(seed))), function (err, res) {
			if(err){
				callback(err);
			}else{
				var dseed = crypto.deriveSeed(seed);
				var encryptedMaster = Buffer.from(res, 'hex');
				fs.writeFile(utils.getMasterPath(dseed), encryptedMaster, function (err) {
					if(err){
						return callback(err);
					}
					crypto.saveDSeed(dseed, utils.defaultPin, utils.Paths.Dseed, function (err) {
						if(err){
							return callback(err);
						}
						var masterCsb = crypto.decryptJson(encryptedMaster, dseed);
						self.__getCsbsToRestore(masterCsb, aliasCsb, function (err, csbs) {
							if(err){
								return callback(err);
							}
							self.restoreCsbs(url, csbs, 0, function (err) {
								if(err) {
									return callback(err);
								}
							});
						});
					});
				});

			}
		});
	},
	restoreCsbs: function(url, csbs, currentCsb, callback){
		var self = this;
		if(currentCsb == csbs.length){
			if(csbs.length == 1){
				$$.interact.say(csbs[0]["Title"], "has been restored");
			}else {
				$$.interact.say("All csbs have been restored");
			}
			}else{
			$$.remote.doHttpGet(path.join(url, "CSB", csbs[currentCsb]["Path"]), function(err, res){
				if(err){
					callback(err);
				}else{
					var encryptedCsb = Buffer.from(res, "hex");
					var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
					if(csb["records"] && csb["records"]["Csb"]){
						csbs = csbs.concat(csb["records"]["Csb"]);
					}
					fs.writeFile(csbs[currentCsb]["Path"], encryptedCsb, function (err) {
						if(err){
							return callback(err);
						}
						self.restoreCsbs(url, csbs, currentCsb + 1, function (err) {
							if(err){
								return callback(err);
							}
						});
					});
				}
			})
		}
	},
	__getCsbsToRestore: function (masterCsbData, aliasCsb, callback) {
		if(!aliasCsb){
			callback(null, masterCsbData["records"]["Csb"]);
		}else{
			utils.findCsb(masterCsbData, aliasCsb, function (err, csb) {
				if(err){
					return callback(err);
				}
				callback(null, [csb]);
			});
		}
	}

});

