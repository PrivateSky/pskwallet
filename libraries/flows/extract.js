var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("extract", {
	start: function (csbUrl, alias) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.checkTypeOfAlias(pin, csbUrl, alias);
		});
	},
	checkTypeOfAlias: function (pin, csbUrl, alias) {
		var masterCsb = utils.readMasterCsb(pin);
		var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data,csbUrl);
		if(!parentChildCsbs){
			console.log("Invalid url");
			return;
		}
		var csb = parentChildCsbs[1];
		var indexCsb = utils.indexOfRecord(csb.Data, "Csb", alias);
		if(indexCsb >= 0){
			this.extractCsb(csb, alias, indexCsb);
		}else{
			if(!csb.Data["records"] || !csb.Data["records"]["Adiacent"]){
				console.log("Csb", csb["Title"], "does not contain any file.");
				return;
			}
			var indexAdiacent = csb.Data["records"]["Adiacent"].indexOf(crypto.generateSafeUid(Buffer.from(csb.Dseed, "hex"), alias));
			if(indexAdiacent < 0){
				console.log("Csb", csb["Title"], "does not contain a file having the alias", alias);
				return;
			}else{
				this.extractArchive(csb, alias, indexAdiacent)
			}
		}
	},
	extractCsb: function (csb, alias, indexCsb) {
		var childCsb = utils.readCsb(csb.Data["records"]["Csb"][indexCsb]["Path"], csb.Data["records"]["Csb"][indexCsb]["Dseed"]);
		fs.writeFileSync(path.join(process.cwd(), alias), JSON.stringify(childCsb, null, "\t"));
		fs.unlinkSync(csb.Data["records"]["Csb"][indexCsb]["Path"]);
		csb.Data["records"]["Csb"].splice(indexCsb, 1);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	},
	extractArchive: function (csb, alias, indexAdiacent) {
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]), path.join(process.cwd(), alias), csb.Dseed);
		csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});