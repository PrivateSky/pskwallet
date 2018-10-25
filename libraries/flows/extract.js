var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = require("pskcrypto");
$$.swarm.describe("extract", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin");
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.checkType(pin);
			}
		})
	},
	checkType: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(err){
				self.swarm("interaction", "printError", err);
				return;
			}
			if(args.length > 3 || args.length < 2){
				self.swarm("interaction", "invalidUrl");
				return;
			}

			var parentCsb = args[0];
			var aliasCsb = args[1];
			if(!parentCsb || !parentCsb.Data || (!parentCsb.Data["records"]["Csb"] && !parentCsb.Data["records"]["Adiacent"])){
				self.swarm("interaction", "invalidUrl");
				return;
			}
			if(parentCsb.Data["records"]["Csb"].length === 0 && parentCsb.Data["records"]["Adiacent"].length === 0) {
				self.swarm("interaction", "empty");
				return;
			}

			utils.getChildCsb(parentCsb, aliasCsb, function (err, csb) {
				if(err){
					self.swarm("interaction", "printError", err);
				}
				if(!csb){
					self.swarm("interaction", "invalidUrl");
					return;
				}
				if(args.length === 3) {
					var aliasFile = args[2];
					var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", aliasFile);
					if (indexAdiacent >= 0) {
						self.extractArchive(csb, aliasFile, indexAdiacent, function (err) {

						});
					} else {
						self.swarm("interaction", "invalidUrl");
					}
				}else {
					self.extractCsb(csb, function (err) {
						self.swarm("interaction", "printError", err);
					});
				}
			});
		});
	},
	extractCsb: function (csb) {
		var self = this;
		fs.writeFile(path.join(process.cwd(), csb.Title), JSON.stringify(csb.Data, null, "\t"), function (err) {
			if(err){
				self.swarm("interaction", "printError", err);
				return;
			}
			self.swarm("interaction", "csbExtracted", csb.Title);
		});
	},
	extractArchive: function (csb, aliasFile, indexAdiacent) {
		var self = this;
		var inputPath = path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]["Path"]);
		var dseed = Buffer.from(csb.Data["records"]["Adiacent"][indexAdiacent]["Dseed"], "hex");
		console.log("Adiacent", csb.Data["records"]["Adiacent"][indexAdiacent]);
		crypto.decryptStream(inputPath, process.cwd(), dseed, function (err) {
				if(err){
					self.swarm("interaction", "printError", err);
					return;
				}
				self.swarm("interaction", "archiveExtracted", aliasFile);
			});
	}
});