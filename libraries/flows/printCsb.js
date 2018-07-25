var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("printCsb", {
	start: function (aliasCsb) {
		utils.requirePin(aliasCsb, this.printCsb);
	},
	printCsb: function (pin, aliasCsb) {
		var masterCsb = utils.readMasterCsb(pin);
		if(!masterCsb.csbData["records"]) {
			throw new Error("There aren't any csbs in the current folder");
		}
		
		if(!masterCsb.csbData["records"]["Csb"]){
			throw new Error("There aren't any csbs in the current folder");
		}
		if(!utils.checkAliasExists(masterCsb, aliasCsb)){
			throw new Error("A csb with the provided alias does not exist");
		}

		for(var c in masterCsb.csbData["records"]["Csb"]){
			if(masterCsb.csbData["records"]["Csb"][c]["Alias"] == aliasCsb){
				var csb = utils.readCsb(masterCsb.csbData["records"]["Csb"][c]["Path"], Buffer.from(masterCsb.csbData["records"]["Csb"][c]["Dseed"], "hex"));
				console.log(csb);
				break;
			}
		}
	}
});