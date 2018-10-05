var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");
require('psk-http-client');

$$.flow.describe("restore", {
	start: function (alias) {
		var self = this;
		utils.masterCsbExists(function (err, status) {
			if(!err){
				utils.enterSeed(function (err, seed) {
					self.readMaster(seed, alias, function (err) {
						if(err){
							throw err;
						}
					});
				});
			}else{
				utils.enterSeed(function (err, seed) {
					self.restoreMaster(seed, alias, function (err) {
						if(err) {
							throw err;
						}
					});
				});
			}
		});
	},
	readMaster: function (seed, alias, callback) {
		var self = this;
		utils.loadMasterCsb(null, seed, function (err, masterCsb) {
			if(err){
				return callback(err);
			}
			self.__getCsbsToRestore(masterCsb.Data, alias, function (err, csbs) {
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
	restoreMaster: function (seed, alias, callback) {
		var obj = JSON.parse(seed.toString());
		var url = obj.backup;
		$$.interact.say(url);
		var self = this;
		console.log(url +"/CSB/" + utils.getMasterUid(crypto.deriveSeed(seed)));
		$$.remote.doHttpGet(url +"/CSB/" + utils.getMasterUid(crypto.deriveSeed(seed)), function (err, encryptedMaster) {
			if(err){
				callback(err);
			}else{
				var dseed = crypto.deriveSeed(seed);
				console.log("Typeee", typeof encryptedMaster);
				// encryptedMaster = Buffer.from(encryptedMaster, 'binary');
				// encryptedMaster = Buffer.from(encryptedMaster);
				console.log(encryptedMaster.length);
				fs.writeFile(utils.getMasterPath(dseed), encryptedMaster, function (err) {
					if(err){
						return callback(err);
					}
					crypto.saveDSeed(dseed, utils.defaultPin, utils.Paths.Dseed, function (err) {
						if(err){
							return callback(err);
						}
						var masterCsb = crypto.decryptJson(encryptedMaster, dseed);
						self.__getCsbsToRestore(masterCsb, alias, function (err, csbs) {
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
			$$.remote.doHttpGet(url + "/CSB/" + csbs[currentCsb]["Path"], function(err, encryptedCsb){
				if(err){
					callback(err);
				}else{
					function __saveCsb() {
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
					console.log("Typeee", typeof encryptedCsb);
					// encryptedCsb = Buffer.from(encryptedCsb, 'binary');
					// encryptedCsb = Buffer.from(encryptedCsb);
					var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
					if(csb["records"] ){
						if(csb["records"]["Csb"] && csb["records"]["Csb"].length > 0) {
							csbs = csbs.concat(csb["records"]["Csb"]);
						}
						if(csb["records"]["Adiacent"] && csb["records"]["Adiacent"].length > 0){
							self.restoreArchives(url, csb["records"]["Adiacent"], 0, function (err) {
								if(err){
									return callback(err);
								}
								__saveCsb();
							})
						}else{
							__saveCsb();
						}

					}

				}
			})
		}
	},
	restoreArchives: function (url, archives, currentArchive, callback) {
		var self = this;
		if(currentArchive == archives.length){
			return callback(null);
		}
		$$.remote.doHttpGet(url + "/CSB/" + archives[currentArchive]["Path"], function(err, data){
			if(err){
				$$.interact.say("Failed to post archive", archives[currentArchive]["Title"],"on server");
				callback(err);
			}else{
				$$.ensureFolderExists(utils.Paths.Adiacent, function (err) {
					if(err){
						return callback(err);
					}

					// data = Buffer.from(data);
					fs.writeFile(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]), data, function (err) {
						if(err){
							return callback(err);
						}
					});
					self.restoreArchives(url, archives, currentArchive + 1, callback);
				});
			}
		});

	},
	__getCsbsToRestore: function (masterCsbData, alias, callback) {
		if(!alias){
			callback(null, masterCsbData["records"]["Csb"]);
		}else{
			utils.findCsb(masterCsbData, alias, function (err, csb) {
				if(err){
					return callback(err);
				}
				callback(null, [csb]);
			});
		}
	}
});

