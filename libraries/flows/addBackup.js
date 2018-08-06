var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");
const client = $$.requireModule('psk-http-client');
$$.flow.describe("addBackup", {
	start: function (url) {
		utils.requirePin(url, null, this.backupMaster);
	},
	backupMaster: function (pin, url) {
		var masterCsb = utils.readMasterCsb(pin);
		masterCsb.Data["backups"].push(url);
		var csbs = masterCsb.Data["records"]["Csb"];
		var encryptedMaster = crypto.encryptJson(masterCsb.Data, masterCsb.Dseed);
		utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed);
		var self = this;
		$$.remote.doHttpPost(url+"/CSB/"+masterCsb.uid, encryptedMaster.toString("hex"), function (err) {
			if(err){
				console.log("Failed to post master Csb on server");
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
			var encryptedCsb = utils.readEncryptedCsb(csbs[currentCsb]["Path"]);
			var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
			if(csb["records"] && csb["records"]["Csb"]){
				csbs = csbs.concat(csb["records"]["Csb"]);
			}
			$$.remote.doHttpPost(url + "/CSB/" + csbs[currentCsb]["Path"], encryptedCsb.toString("hex"), function(err){
				if(err){
					console.log("Failed to post csb", csbs[currentCsb]["Title"],"on server");
					process.exit();
				}else{
					self.backupCsbs(url, csbs, currentCsb + 1);
				}
			})
		}
	}

});