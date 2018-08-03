var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("printCsb", {
	start: function (aliasCsb) {
		utils.requirePin(aliasCsb, null, this.printCsb);
	},
	printCsb: function (pin, aliasCsb) {
		var masterCsb = utils.readMasterCsb(pin);
		if(!masterCsb.data["records"]) {
			console.log("There aren't any csbs in the current folder");
			return;
		}
		
		if(!masterCsb.data["records"]["Csb"]){
			console.log("There aren't any csbs in the current folder");
			return;
		}
		if(utils.indexOfRecord(masterCsb.data, "Csb", aliasCsb) < 0){
			console.log("A csb with the provided alias does not exist");
			return;
		}

		for(var c in masterCsb.data["records"]["Csb"]){
			if(masterCsb.data["records"]["Csb"][c]["Alias"] == aliasCsb){
				var csb = utils.readCsb(masterCsb.data["records"]["Csb"][c]["Path"], Buffer.from(masterCsb.data["records"]["Csb"][c]["Dseed"], "hex"));
				console.log(csb);
				break;
			}
		}
	}
});