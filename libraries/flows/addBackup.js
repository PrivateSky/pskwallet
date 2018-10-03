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

				$$.remote.doHttpPost(url + "/CSB/" + masterCsb.Uid, encryptedMaster.toString("hex"), function (err, res) {
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
				function __backupCsb() {
					$$.remote.doHttpPost(path.join(url, "CSB", csbs[currentCsb]["Path"]), encryptedCsb.toString("hex"), function(err){
						if(err){
							$$.interact.say("Failed to post csb", csbs[currentCsb]["Title"],"on server");
							callback(err);
						}else{
							self.backupCsbs(url, csbs, currentCsb + 1, callback);
						}
					})
				}

				if(csb["records"]){
					if(csb["records"]["Csb"] && csb["records"]["Csb"].length > 0) {
						csbs = csbs.concat(csb["records"]["Csb"]);
					}
					if(csb["records"]["Adiacent"] && csb["records"]["Adiacent"].length > 0){
						self.backupArchives(url, csb["records"]["Adiacent"], 0, function (err) {
							if(err){
								return callback(err);
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
	backupArchives: function (url, archives, currentArchive, callback) {
		console.log('backing up')
		var self = this;
		if(currentArchive == archives.length){
			return callback();
		}
		const stream = fs.createReadStream(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]));
		// console.log('stats ', fs.statSync(path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"])));
		// stream.on('readable', function () {
		// 	var buffer = stream.read(10);
		// 	if (buffer) {
		// 		console.log(buffer.toString('utf8'));
		// 	}
		// });
		// console.log('DOING HTTP POST', path.join(utils.Paths.Adiacent, archives[currentArchive]["Path"]));
		stream.setEncoding('hex');
		$$.remote.doHttpPost(url + "/CSB/" + archives[currentArchive]["Path"], stream, function(err){
			stream.close();
			if(err){
				console.log(err.statusCode)
				$$.interact.say("Failed to post archive", archives[currentArchive]["Title"],"on server");
				callback(err);
			}else{
				self.backupArchives(url, archives, currentArchive + 1, callback);
			}
		})
	}
});