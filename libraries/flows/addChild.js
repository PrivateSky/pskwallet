var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.flow.describe("addChild", {
	start: function (aliasParentCsb, aliasChildCsb) {
		utils.requirePin([aliasParentCsb, aliasChildCsb], null, this.absorbCsb);
	},
	absorbCsb: function (pin, aliasParentCsb, aliasChildCsb) {
		var masterCsb = utils.readMasterCsb(pin);
		if(!masterCsb.csbData["records"]) {
			console.log("There aren't any csbs in the current folder");
		}

		if(!masterCsb.csbData["records"]["Csb"]){
			console.log("There aren't any csbs in the current folder");
		}
		var indexParentCsb = utils.indexOfRecord(masterCsb.csbData, "Csb", aliasParentCsb);
		if( indexParentCsb < 0){
			console.log(aliasParentCsb, "does not exist");
			return;
		}
		var indexChildCsb = utils.indexOfRecord(masterCsb.csbData, "Csb", aliasChildCsb);
		if(indexChildCsb < 0){
			console.log(aliasChildCsb, "does not exist");
			return;
		}
		var csbsInMaster = masterCsb.csbData["records"]["Csb"];

		var parentCsb = utils.readCsb(csbsInMaster[indexParentCsb]["Path"], Buffer.from(csbsInMaster[indexParentCsb]["Dseed"], "hex"));

		if(!parentCsb["records"]){
			parentCsb["records"] = {};
		}
		if(!parentCsb["records"]["Csb"]){
			parentCsb["records"]["Csb"] = [];
		}
		parentCsb["records"]["Csb"].push(csbsInMaster[indexChildCsb]);
		utils.writeCsbToFile(csbsInMaster[indexParentCsb]["Path"], parentCsb,  Buffer.from(csbsInMaster[indexParentCsb]["Dseed"], "hex"));
		masterCsb.csbData["records"]["Csb"].splice(indexChildCsb, 1);
		utils.writeCsbToFile(utils.getMasterPath(masterCsb.dseed), masterCsb.csbData, masterCsb.dseed);
		console.log(aliasChildCsb, "has been added as child in", aliasParentCsb);
	}
});