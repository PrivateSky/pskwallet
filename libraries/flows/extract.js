var path = require("path");

const utils = require("./../../utils/flowsUtils");
const fs = require("fs");
const crypto = require("pskcrypto");
$$.swarm.describe("extract", {
	start: function (url) {
		this.url = url;
		console.log(this.url);
		this.swarm("interaction", "readPin", utils.noTries);
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
				self.swarm("interaction", "handleError", err);
				return;
			}
			if(args.length > 3 || args.length < 2){
				self.swarm("interaction", "handleError", null, "Invalid url", true);
				return;
			}

			var parentCsb = args[0];
			var aliasCsb = args[1];
			if(!parentCsb || !parentCsb.Data || (!parentCsb.Data["records"]["Csb"] && !parentCsb.Data["records"]["Adiacent"])){
				self.swarm("interaction", "handleError", null, "Invalid url", true);
				return;
			}
			if(parentCsb.Data["records"]["Csb"].length === 0 && parentCsb.Data["records"]["Adiacent"].length === 0) {
				self.swarm("interaction", "handleError", null, "Provided Csb does not contain other csbs or files", true);
				return;
			}

			utils.getChildCsb(parentCsb, aliasCsb, function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to load child csb");
					return;
				}
				if(!csb){
					self.swarm("interaction", "handleError", null, "Invalid url", true);
					return;
				}
				if(args.length === 3) {
					var aliasFile = args[2];
					var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", aliasFile);
					if (indexAdiacent >= 0) {
						self.extractArchive(csb, aliasFile, indexAdiacent);
					} else {
						self.swarm("interaction", "handleError", null, "Invalid url", true);
					}
				}else {
					self.extractCsb(csb);
				}
			});
		});
	},
	extractCsb: function (csb) {
		var self = this;
		fs.writeFile(path.join(process.cwd(), csb.Title), JSON.stringify(csb.Data, null, "\t"), function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to write csb " + csb.Title);
				return;
			}
			self.swarm("interaction", "printInfo", "The csb " + csb.Title + "was successfully extracted");
		});
	},
	extractArchive: function (csb, aliasFile, indexAdiacent) {
		var self = this;
		var inputPath = path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]["Path"]);
		var dseed = Buffer.from(csb.Data["records"]["Adiacent"][indexAdiacent]["Dseed"], "hex");
		crypto.decryptStream(inputPath, process.cwd(), dseed, function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to decrypt " + "");
				return;
			}
			self.swarm("interaction", "printInfo", "The archive " + aliasFile + " was successfully extracted");
		});
	}
});