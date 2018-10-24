var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");
const client = require('psk-http-client');
$$.swarm.describe("saveBackup", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin", 3);
	},

	readPin: "interaction",

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				console.log("Invalid pin");
				console.log("Try again");
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.backupMaster(pin);
			}
		})
	},

	backupMaster: function (pin) {
		var self = this;
		utils.loadMasterCsb(pin, null, function (err, masterCsb) {
			// masterCsb.Data["backups"].push(url);
			var csbs = masterCsb.Data["records"]["Csb"];
			var encryptedMaster = crypto.encryptJson(masterCsb.Data, masterCsb.Dseed);
			console.log(encryptedMaster.length);
			utils.writeCsbToFile(masterCsb.Path, masterCsb.Data, masterCsb.Dseed, function (err) {
				if(err){
					self.swarm("interaction", "printError", err);
				}
				$$.remote.doHttpPost(self.url + "/CSB/" + masterCsb.Uid, encryptedMaster, function (err) {
					if(err){
						self.swarm("interaction", "errorOnPost");
					}else{
						self.backupCsbs(csbs, 0, function (err) {
							if(err){
								self.swarm("interaction", "printError", err);
							}
						});
					}
				});
			});
		});

	},
	backupCsbs: function(csbs, currentCsb){
		var self = this;
		if(currentCsb == csbs.length){
			self.swarm("interaction", "onComplete");
		}else{
			utils.readEncryptedCsb(csbs[currentCsb]["Path"], function (err, encryptedCsb) {
				if(err){
					self.swarm("interaction", "printError", err);
				}
				var csb = crypto.decryptJson(encryptedCsb, Buffer.from(csbs[currentCsb]["Dseed"], "hex"));
				function __backupCsb() {
					$$.remote.doHttpPost(self.url + "/CSB/" + csbs[currentCsb]["Path"], encryptedCsb, function(err){
						if(err){
							self.swarm("interaction", "errorOnPost");
						}else{
							self.backupCsbs(csbs, currentCsb + 1);
						}
					})
				}

				if(csb["records"]){
					if(csb["records"]["Csb"] && csb["records"]["Csb"].length > 0) {
						csbs = csbs.concat(csb["records"]["Csb"]);
					}
					if(csb["records"]["Adiacent"] && csb["records"]["Adiacent"].length > 0){
						self.backupArchives(csb["records"]["Adiacent"], 0, function (err) {
							if(err){
								self.swarm("interaction", "printError", err);
							}
							__backupCsb();
						})
					}else{
						__backupCsb();
					}
				}
			});
		}
	},
	backupArchives: function (archives, currentArchive) {
		var self = this;
		if(currentArchive == archives.length){
			self.swarm("interaction", "onComplete");
			return;
		}
		const stream = fs.createReadStream(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]));
		$$.remote.doHttpPost(self.url + "/CSB/" + archives[currentArchive]["Path"], stream, function(err){
			stream.close();
			if(err){
				self.swarm("interaction", "errorOnPost");
			}else{
				self.backupArchives(archives, currentArchive + 1);
			}
		})
	}
});