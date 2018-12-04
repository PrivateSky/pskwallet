var path = require("path");

const utils = require("./../../utils/flowsUtils");
const fs = require("fs");
const crypto = require("pskcrypto");
$$.swarm.describe("addFile", {
	start: function (url, filePath) {
		this.url = url;
		this.filePath = filePath;
		if(!filePath){
			this.swarm("interaction", "handleError", null, "A file path should be specified", true);
			return;
		}
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.addArchive(pin);
			}
		})
	},
	addArchive: function (pin) {
		this.filePath = path.resolve(this.filePath);
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to traverse url");
				return;
			}
			if(args.length !== 3){
				self.swarm("interaction", "handleError", null, "Invalid number of arguments", true);
				return;
			}
			utils.getChildCsb(args[0], args[1], function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to get child csb");
					return;
				}
				var alias = args[2];

				if(!csb.Data["records"]["Adiacent"]) {
					csb.Data["records"]["Adiacent"] = [];
				}
				$$.ensureFolderExists(utils.Paths.Adiacent, function (err) {
					if (err) {
						self.swarm("interaction", "handleError", err, "Failed to create Adiacent folder");
						return;
					}
					var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", alias);
					if (indexAdiacent >= 0) {
						self.swarm("interaction", "confirmOverwriteFile", self.filePath);
					} else {
						self.saveChildInCsb(csb, alias, indexAdiacent);
					}
				})
			});
		});
	},
	saveChildInCsb: function (csb, alias, indexAdiacent) {
		var self = this;
		var seed = crypto.generateSeed(utils.defaultBackup);
		var dseed = crypto.deriveSeed(seed);
		var pth = crypto.generateSafeUid(dseed, path.basename(this.filePath));
		var fileRecord = {
			"Title": alias,
			"Path" : pth,
			"Seed" : seed.toString("hex"),
			"Dseed": dseed.toString("hex")
		};
		crypto.encryptStream(this.filePath, path.join(utils.Paths.Adiacent, pth), dseed, function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to encrypt stream");
				return;
			}
			if(indexAdiacent >= 0){
				csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
			}
			csb.Data["records"]["Adiacent"].push(fileRecord);

			utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to write csb to file");
					return;
				}
				self.swarm("interaction", "printInfo", self.filePath + " has been successfully added to " + csb.Title);
			});
		});

	}
});
