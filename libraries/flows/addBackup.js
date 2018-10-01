var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");
const client = require('psk-http-client');
$$.flow.describe("addBackup", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.backupMaster(pin, url, function (err) {
				if(err){
					throw err;
				}
			});
		});
	},
	backupMaster: function (pin, url, callback) {
		var self = this;
		utils.loadMasterCsb(pin, null, function (err, masterCsb) {
			masterCsb.Data["backups"].push(url);
			var csbs = masterCsb.Data["records"]["Csb"];
			var encryptedMaster = crypto.encryptJson(masterCsb.Data, masterCsb.Dseed);
			utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed, function (err) {
				if(err){
					return callback(err);
				}
				$$.remote.doHttpPost(path.join(url, "CSB", masterCsb.Uid), encryptedMaster.toString("hex"), function (err) {
					if(err){
						$$.interact.say("Failed to post master Csb on server");
					}else{
						self.backupCsbs(url, csbs, 0, function (err) {
							if(err){
								return callback(err);
							}
						});
					}
				});
			});
		});

	},
	backupCsbs: function(url, csbs, currentCsb, callback){
		var self = this;
		if(currentCsb == csbs.length){
			$$.interact.say("All csbs are backed up");
		}else{
			utils.readEncryptedCsb(csbs[currentCsb]["Path"], function (err, encryptedCsb) {
				if(err){
					return callback(err);
				}
				var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
				if(csb["records"] && csb["records"]["Csb"]){
					csbs = csbs.concat(csb["records"]["Csb"]);
				}
				$$.remote.doHttpPost(path.join(url, "CSB", csbs[currentCsb]["Path"]), encryptedCsb.toString("hex"), function(err){
					if(err){
						$$.interact.say("Failed to post csb", csbs[currentCsb]["Title"],"on server");
						process.exit();
					}else{
						self.backupCsbs(url, csbs, currentCsb + 1, callback);
					}
				})
			});
		}
	}

});