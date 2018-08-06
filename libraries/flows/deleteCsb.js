var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));

$$.flow.describe("deleteCsb", {
	start: function (aliasCsb) {
		utils.requirePin(aliasCsb, null, this.getCsb);
	},
	getCsb: function (pin, aliasCsb) {
		var csb,
			prompt;

		if(!aliasCsb){
			csb = utils.readMasterCsb(pin);
			prompt = "You are about to delete all csbs in the current directory. ";
		}else{
			csb = utils.getCsb(pin, aliasCsb);
			prompt = "You are about to delete " + aliasCsb + " and its children csbs.";

		}
		prompt +="Do you want to continue?";

		utils.confirmOperation([csb, null], prompt, this.deleteCsb);
	},
	deleteCsb: function (csb) {

		if(!csb.data || !csb.data["records"] || !csb.data["records"]["Csb"] || csb.data["records"]["Csb"].length === 0){
			utils.deleteCsb(csb.path);
			return;
		}
		console.log(csb.data["records"]["Csb"]);
		while(csb.data["records"]["Csb"].length > 0){
			var csbRecord = csb.data["records"]["Csb"].shift();
			let childCsb = {
				"data": utils.readCsb(csbRecord["Path"], Buffer.from(csbRecord["Dseed"], "hex")),
				"path": csbRecord["Path"],
				"dseed": Buffer.from(csbRecord["Dseed"], "hex")
			};
			if(csb.data["records"]["Csb"].length === 0) {
				if (this.__isMaster(csb)) {
					utils.deleteMasterCsb(csb);
				} else {
					utils.deleteCsb(csb.path);
				}
			}
			this.deleteCsb(childCsb);
		}
	},
	__isMaster: function (csb) {
		try{
			utils.getMasterPath(csb.dseed);
		}catch(e){
			return false;
		}
		return true;
	}
});