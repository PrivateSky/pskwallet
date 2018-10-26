var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");
require('psk-http-client');

$$.swarm.describe("restore", {
	start: function (alias) {
		this.alias = alias;
		this.swarm("interaction", "readSeed");

	},
	checkMasterExists: function (seed) {
		var self = this;
		self.seed = seed;
		utils.masterCsbExists(function (err, status) {
			if(!err){
				self.loadMaster();
			}else{
				self.restoreMaster();
			}
		});
	},
	loadMaster: function () {
		utils.loadMasterCsb(null, this.seed, this.reportOrContinue("getCsbsToRestore", "Failed to load master"));
	},
	restoreMaster: function (seed) {
		var obj = JSON.parse(seed.toString());
		this.url = obj.backup;
		this.dseed = crypto.deriveSeed(seed);
		$$.remote.doHttpGet(this.url +"/CSB/" + utils.getMasterUid(this.dseed), this.reportOrContinue("createAuxFolder", "Error at getting encryptedMaster"));
	},

	createAuxFolder: function (encryptedMaster) {
		this.encryptedMaster = encryptedMaster;
		$$.ensureFolderExists(utils.Paths.auxFolder, this.reportOrContinue("writeMaster", "Error at aux folder creation"));
	},

	writeMaster: function () {
		fs.writeFile(utils.getMasterPath(this.dseed), this.encryptedMaster, this.reportOrContinue("saveDseed", "Error at writing masterCsb"));
	},
	saveDseed: function () {
		this.masterCsbData = crypto.decryptJson(this.encryptedMaster, this.dseed);
		crypto.saveDSeed(this.dseed, utils.defaultPin, utils.Paths.Dseed, this.reportOrContinue("getCsbsToRestore", "Failed at saving dseed"));

	},
	getCsbsToRestore: function (masterCsb) {

		if(!this.masterCsbData && masterCsb) {
			this.masterCsbData = masterCsb.Data;
		}
		console.log("masterCsbData", this.masterCsbData);
		if(!this.url) {
			this.url = this.masterCsbData["backups"][0];
		}
		console.log("this.url", this.url);
		this.__getCsbsToRestore(this.masterCsbData, this.alias, this.reportOrContinue("restoreCsbs", "Failed to get csbs from master", 0));
	},
	restoreCsbs: function(csbs, currentCsb){
		var self = this;
		this.csbs = csbs;
		this.currentCsb = currentCsb;

		if(currentCsb == csbs.length) {
			self.swarm("interaction", "csbRestoration", csbs);
			return;
		}
		$$.remote.doHttpGet(self.url + "/CSB/" + csbs[currentCsb]["Path"], this.reportOrContinue("saveCsb", "Failed to get csb from server"));

		var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
		if(csb["records"] ){
			if(csb["records"]["Csb"] && csb["records"]["Csb"].length > 0) {
				csbs = csbs.concat(csb["records"]["Csb"]);
			}
			if(csb["records"]["Adiacent"] && csb["records"]["Adiacent"].length > 0){
				self.restoreArchives(self.url, csb["records"]["Adiacent"], 0, self.reportOrContinue("__saveCsb", this.csbs, this.currentCsb, this.encryptedCsb))
			}else{
				self.__saveCsb(this.csbs, this.currentCsb, this.encryptedCsb);
			}

		}

	},
	__saveCsb: function(csbs, currentCsb, encryptedCsb) {
		fs.writeFile(csbs[currentCsb]["Path"], encryptedCsb, this.reportOrContinue("restoreCsbs", "Failed to save csb", currentCsb + 1));
	},
	reportOrContinue:function(phaseName, errorMessage, args){
		var self = this;
		return function(err,res) {
			if (err) {
				self.swarm("interaction", "handleError", err, errorMessage);
			} else {
				if (phaseName) {
					self[phaseName](res, args);
				}
			}
		}
	},
	restoreArchives: function (url, archives, currentArchive) {
		var self = this;
		if(currentArchive == archives.length){
			self.swarm("interaction", "archiveRestoration", currentArchive, archives);
			return;
		}
		$$.remote.doHttpGet(url + "/CSB/" + archives[currentArchive]["Path"], function(err, data){
			if(err){
				self.swarm("interaction", "handleError", err, "Error at getting archives");
			}else{
				$$.ensureFolderExists(utils.Paths.Adiacent, function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Error in ensureFolderExists");
						return;
					}
					fs.writeFile(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]), data, function (err) {
						if(err){
							self.swarm("interaction", "handleError", err, "Error in writing archive"+archives[currentArchive]["Path"]);
						}
					});
					self.restoreArchives(url, archives, currentArchive + 1);
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

