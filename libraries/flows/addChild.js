var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.flow.describe("addChild", {
	start: function (aliasParentCsb, aliasChildCsb) {
		utils.requirePin([aliasParentCsb, aliasChildCsb], this.absorbCsb);
	},
	absorbCsb: function (pin, aliasParentCsb, aliasChildCsb) {
		var masterCsb = utils.readMasterCsb(pin);
		if(!masterCsb.csbData["records"]) {
			throw new Error("There aren't any csbs in the current folder");
		}

		if(!masterCsb.csbData["records"]["Csb"]){
			throw new Error("There aren't any csbs in the current folder");
		}
		if(!utils.checkAliasExists(masterCsb, aliasParentCsb)){
			throw new Error("Parent csb does not exist");
		}
		if(!utils.checkAliasExists(masterCsb, aliasChildCsb)){
			throw new Error("Child csb does not exist");
		}
		var csbsInMaster = masterCsb.csbData["records"]["Csb"];
		for(var c in csbsInMaster) {
			if (csbsInMaster[c]["Alias"] == aliasParentCsb) {
				var parentCsb = utils.readCsb(csbsInMaster[c]["Path"], Buffer.from(csbsInMaster[c]["Dseed"], "hex"));
				var indexParent = c;
				break;
			}
		}
		for(var c in csbsInMaster){
			if(csbsInMaster[c]["Alias"] == aliasChildCsb){
				if(!parentCsb["records"]){
					parentCsb["records"] = {};
				}
				if(!parentCsb["records"]["Csb"]){
					parentCsb["records"]["Csb"] = [];
				}
				parentCsb["records"]["Csb"].push(csbsInMaster[c]);
				utils.writeCsbToFile(csbsInMaster[indexParent]["Path"], parentCsb,  Buffer.from(csbsInMaster[indexParent]["Dseed"], "hex"));
				masterCsb.csbData["records"]["Csb"].splice(c, 1);
				utils.writeCsbToFile(utils.paths.masterCsb, masterCsb.csbData, masterCsb.dseed);
			}
		}

	}

});