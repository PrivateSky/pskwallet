var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");
$$.requireModule('psk-http-client');

$$.flow.describe("restore", {
	start: function (aliasCsb) {
		var self = this;
		if(utils.masterCsbExists()) {
			utils.enterSeed(function (err, seed) {
				self.readMaster(seed, aliasCsb);
			});
		}else{
			utils.enterSeed(function (err, seed) {
				self.restoreMaster(seed, aliasCsb);
			});
		}
	},
	readMaster: function (seed, aliasCsb) {
		var masterCsb = utils.readMasterCsb(null, seed);
		var csbs 	  = this.__getCsbsToRestore(masterCsb.Data, aliasCsb);
		console.log(masterCsb.Data["backups"]);
		this.restoreCsbs(masterCsb.Data["backups"][0], csbs, 0);
	},
	restoreMaster: function (seed, aliasCsb) {
		var obj = JSON.parse(seed.toString());
		var url = obj.backup;
		console.log(url);
		var self = this;
		$$.remote.doHttpGet(url + "/CSB/" + utils.getMasterUid(crypto.deriveSeed(seed)), function (err, res) {
			if(err){
				throw err;
			}else{
				var dseed = crypto.deriveSeed(seed);
				var encryptedMaster = Buffer.from(res, 'hex');
				fs.writeFileSync(utils.getMasterPath(dseed), encryptedMaster);
				crypto.saveDSeed(dseed, utils.defaultPin, utils.Paths.Dseed);
				var masterCsb = crypto.decryptJson(encryptedMaster, dseed);
				// console.log(masterCsb)
				// fs.writeFileSync(utils.Paths.recordStructures + "/test_csb_master.json", JSON.stringify(masterCsb,null, "\t"));
				var csbs = self.__getCsbsToRestore(masterCsb, aliasCsb);
				self.restoreCsbs(url, csbs, 0);
			}
		});
	},
	restoreCsbs: function(url, csbs, currentCsb){
		var self = this;
		if(currentCsb == csbs.length){
			if(csbs.length == 1){
				console.log(csbs[0]["Alias"], "has been restored");
			}else {
				console.log("All csbs have been restored");
			}
			}else{
			$$.remote.doHttpGet(url + "/CSB/" + csbs[currentCsb]["Path"], function(err, res){
				if(err){
					throw err;
				}else{
					var encryptedCsb = Buffer.from(res, "hex");
					var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
					if(csb["records"] && csb["records"]["Csb"]){
						csbs = csbs.concat(csb["records"]["Csb"]);
					}
					fs.writeFileSync(csbs[currentCsb]["Path"], encryptedCsb);
					self.restoreCsbs(url, csbs, currentCsb + 1);
				}
			})
		}
	},
	__getCsbsToRestore: function (masterCsbData, aliasCsb) {
		if(!aliasCsb){
			return masterCsbData["records"]["Csb"];
		}else{
			return [utils.findCsb(masterCsbData, aliasCsb)];
		}
	}

});

