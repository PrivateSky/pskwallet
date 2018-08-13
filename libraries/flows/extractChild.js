var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("extractChild", {
	start: function (parentUrl, childAlias) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.extractArchive(pin, parentUrl, childAlias);
		});
	},
	extractArchive: function (pin, parentUrl, childAlias) {
		var masterCsb = utils.readMasterCsb(pin);
		var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, parentUrl);
		var parentCsbData = parentChildCsbs[0]
		var index = utils.indexOfRecord(parentCsbData, "Csb", parentChildCsbs[1]);
		if(index < 0){
			console.log("Csb", parentChildCsbs[1], "does not exist");
			return;
		}
		var csb = {
		};
		csb["Path"] = parentCsbData["records"]["Csb"][index].Path;
		csb["Dseed"] = Buffer.from(parentCsbData["records"]["Csb"][index].Dseed, "hex");
		csb["Data"] = utils.readCsb(csb.Path, csb.Dseed);

		if(!csb.Data["records"] || !csb.Data["records"]["Adiacent"]){
			console.log("Csb", parentChildCsbs[1], "does not contain any file.");
			return;
		}
		var indexAdiacent = csb.Data["records"]["Adiacent"].indexOf(crypto.generateSafeUid(csb.Dseed, childAlias));
		console.log("ind adiacent",indexAdiacent)
		if(indexAdiacent < 0){
			console.log("Csb", parentChildCsbs[1], "does not contain a file having the alias", childAlias);
			return;
		}
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]), path.join(process.cwd(), childAlias), csb.Dseed);
	}
});