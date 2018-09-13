var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("extract", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.checkType(pin, url);
		});
	},
	checkType: function (pin, url) {
		var args = utils.traverseUrl(pin, url);
		if(args.length > 2){
			console.log("Invalid url");
			return;
		}
		var parentCsb = args[0];
		var alias = args[1];
		if(!parentCsb || !parentCsb.Data || (!parentCsb.Data["records"]["Csb"] && !parentCsb.Data["records"]["Adiacent"])){
			console.log("Invalid url");
			return;
		}
		if(parentCsb.Data["records"]["Csb"].length === 0 && parentCsb.Data["records"]["Adiacent"].length === 0) {
			console.log("Nothing to extract");
			return;
		}
		var indexCsb = utils.indexOfRecord(parentCsb.Data, "Csb", alias);
		console.log("index = ", indexCsb);
		if(indexCsb < 0 ){
			var indexAdiacent = utils.indexOfRecord(parentCsb.Data, "Adiacent", alias);
			if(indexAdiacent >= 0){
				this.extractArchive(parentCsb, alias, indexAdiacent);
			}else{
				console.log("Invalid url.");
				return;
			}
		}else{
			this.extractCsb(parentCsb, alias, indexCsb);
		}
	},
	checkTypeOfAlias: function (pin, csbUrl, alias) {
		var masterCsb = utils.readMasterCsb(pin);
		var csb;
		if(csbUrl === "master"){
			csb = utils.readMasterCsb(pin);
		}else {
			var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, csbUrl);
			if (!parentChildCsbs) {
				console.log("Invalid url");
				return;
			}
			csb = parentChildCsbs[1];
		}
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
		console.log("Extract csb");
		var childCsb = utils.readCsb(csb.Data["records"]["Csb"][indexCsb]["Path"], csb.Data["records"]["Csb"][indexCsb]["Dseed"]);
		fs.writeFileSync(path.join(process.cwd(), alias), JSON.stringify(childCsb, null, "\t"));
		// fs.unlinkSync(csb.Data["records"]["Csb"][indexCsb]["Path"]);
		// csb.Data["records"]["Csb"].splice(indexCsb, 1);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	},
	extractArchive: function (csb, alias, indexAdiacent) {
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]), path.join(process.cwd(), alias), csb.Dseed);
		csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});