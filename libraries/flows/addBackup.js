var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");
const client = $$.requireModule('psk-http-client');
$$.flow.describe("addBackup", {
	start: function (url) {
		utils.requirePin(url, this.backupMaster);
	},
	backupMaster: function (pin, url) {
		var masterCsb = utils.readMasterCsb(pin);
		masterCsb.csbData["backups"].push(url);
		console.log(masterCsb.csbData);
		var csbs = masterCsb.csbData["records"]["Csb"];
		var encryptedMaster = crypto.encryptJson(masterCsb.csbData, masterCsb.dseed);
		utils.writeCsbToFile(utils.paths.masterCsb, masterCsb.csbData, masterCsb.dseed);
		var self = this;
		$$.remote.doHttpPost(url+"/CSB/master", encryptedMaster.toString("hex"), function (err) {
			if(err){
				throw err;
			}else{
				self.backupCsbs(url, csbs, 0);
			}
		});
	},
	backupCsbs: function(url, csbs, currentCsb){
		var self = this;
		if(currentCsb == csbs.length){
			console.log("All csbs are backed up");
		}else{
			var encryptedCsb = fs.readFileSync(csbs[currentCsb]["Path"]);
			$$.remote.doHttpPost(url + "/CSB/" + csbs[currentCsb]["Path"], encryptedCsb.toString("hex"), function(err){
				if(err){
					throw err;
				}else{
					self.backupCsbs(url, csbs, currentCsb + 1);
				}
			})
		}
	}

});