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
		if(!masterCsb.Data["records"]) {
			console.log("There aren't any csbs in the current folder");
			return;
		}
		
		if(!masterCsb.Data["records"]["Csb"]){
			console.log("There aren't any csbs in the current folder");
			return;
		}

		if(utils.indexOfRecord(masterCsb.Data, "Csb", aliasCsb) < 0){
			console.log("A csb with the provided alias does not exist");
			return;
		}

		for(var c in masterCsb.Data["records"]["Csb"]){
			if(masterCsb.Data["records"]["Csb"][c]["Alias"] == aliasCsb){
				var csb = utils.readCsb(masterCsb.Data["records"]["Csb"][c]["Path"], Buffer.from(masterCsb.Data["records"]["Csb"][c]["Dseed"], "hex"));
				console.log(csb);
				break;
			}
		}
	}
});