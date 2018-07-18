var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require(path.resolve(__dirname + "/../../../pskcrypto/cryptography"));
var fs = require("fs");
$$.requireModule('psk-http-client');
$$.flow.describe("addBackup", {
	start: function (url) {
		utils.enterPin(url, 3, null, this.backupMaster);
	},
	backupMaster: function (pin, url) {
		var masterCsb = utils.readMasterCsb(pin);
		var csbs = masterCsb.csbData["records"]["Csb"];
		var encryptedMaster = fs.readFileSync(utils.paths.masterCsb);
		var self = this;
		$$.remote.doHttpPost(url+"/CSB/master", encryptedMaster, function (err) {
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
			$$.remote.doHttpPost(url + "/CSB/" + csbs[currentCsb]["Path"], encryptedCsb, function(err){
				if(err){
					throw err;
				}else{
					self.backupCsbs(url, csbs, currentCsb + 1);
				}
			})
		}
	}

});