var path = require("path");
const utils = require("./../../utils/flowsUtils");
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
	restoreMaster: function () {
		var obj = JSON.parse(this.seed.toString());
		this.url = obj.backup;
		this.dseed = crypto.deriveSeed(this.seed);
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
		if(!this.url) {
			this.url = this.masterCsbData["backups"][0];
		}
		this.__getCsbsToRestore(this.masterCsbData, this.alias, this.reportOrContinue("restoreCsbs", "Failed to get csbs from master", 0));
	},
	restoreCsbs: function(csbs, currentCsb){
		if(currentCsb == csbs.length) {
			this.swarm("interaction", "printInfo", "All csbs have been restored");
			return;
		}
		$$.remote.doHttpGet(this.url + "/CSB/" + csbs[currentCsb]["Path"], this.reportOrContinue("decryptCsb", "Failed to get csb from server", csbs, currentCsb));



	},
	decryptCsb: function (encryptedCsb, csbs, currentCsb) {
		var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
		if(csb["records"] ){
			if(csb["records"]["Csb"] && csb["records"]["Csb"].length > 0) {
				csbs = csbs.concat(csb["records"]["Csb"]);
			}
			if(csb["records"]["Adiacent"] && csb["records"]["Adiacent"].length > 0){
				this.restoreArchives(this.url, csb["records"]["Adiacent"], 0);
			}else{
				this.__saveCsb(csbs, currentCsb, encryptedCsb);
			}

		}
	},
	__saveCsb: function(csbs, currentCsb, encryptedCsb) {
		fs.writeFile(csbs[currentCsb]["Path"], encryptedCsb, this.reportOrContinue("restoreCsbs", "Failed to save csb", csbs, currentCsb + 1));
	},
	reportOrContinue:function(phaseName, errorMessage, ...args){
		var self = this;
		return function(err,res) {
			if (err) {
				self.swarm("interaction", "handleError", err, errorMessage);
			} else {
				if (phaseName) {
					if(res) {
						self[phaseName](res, ...args);
					}else{
						self[phaseName](...args);
					}
				}
			}
		}
	},
	restoreArchives: function (url, archives, currentArchive) {
		var self = this;
		if(currentArchive == archives.length){
			self.swarm("interaction", "printInfo", "All archives were restored ");
			return;
		}
		$$.remote.doHttpGet(url + "/CSB/" + archives[currentArchive]["Path"], this.reportOrContinue("createAdiacentFolder", "Failed to get archive from server", url, archives, currentArchive));
	},

	createAdiacentFolder: function (data, url, archives, currentArchive) {
		$$.ensureFolderExists(utils.Paths.Adiacent, this.reportOrContinue("saveArchive", "Failed to create folder", data, url, archives, currentArchive));
	},
	saveArchive: function (data, url, archives, currentArchive) {
		fs.writeFile(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]), data, this.reportOrContinue("restoreArchives", "failed to save archive", url, archives, currentArchive+1));
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

