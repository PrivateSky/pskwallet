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
		var parentChildCsb = utils.traverseUrl(pin, masterCsb.Data,csbUrl);
		var parentCsb = parentChildCsb[0];
		var childAlias = parentChildCsb[1];
		var indexCsb = utils.indexOfRecord(parentCsb, "Csb", childAlias);
		if(indexCsb >= 0){

		}else{

		}
		console.log("parametru:", childCsb);
	},
	extractArchive: function (pin, csbUrl, alias) {
		var masterCsb = utils.readMasterCsb(pin);
		var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, csbUrl);
		var parentCsbData = parentChildCsbs[0]
		var index = utils.indexOfRecord(parentCsbData, "Csb", parentChildCsbs[1]);
		if(index < 0){
			console.log("Csb", parentChildCsbs[1], "does not exist");
			return;
		}
		var csb = {
		};
		csb["Path"] = parentCsbData["records"]["Csb"][index].Path;
		csb["Dseed"] = parentCsbData["records"]["Csb"][index].Dseed;
		csb["Data"] = utils.readCsb(csb.Path, csb.Dseed);

		if(!csb.Data["records"] || !csb.Data["records"]["Adiacent"]){
			console.log("Csb", parentChildCsbs[1], "does not contain any file.");
			return;
		}
		var indexAdiacent = csb.Data["records"]["Adiacent"].indexOf(crypto.generateSafeUid(csb.Dseed, alias));
		if(indexAdiacent < 0){
			console.log("Csb", parentChildCsbs[1], "does not contain a file having the alias", alias);
			return;
		}
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]), path.join(process.cwd(), alias), csb.Dseed);
		csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});