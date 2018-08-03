var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");

$$.flow.describe("listCsbs", {
	start: function (aliasCsb) {
		if(!utils.masterCsbExists()){
			console.log("No csb exists");
		}else{
			utils.requirePin(aliasCsb, null, this.getCsb);
		}
	},
	getCsb: function (pin, aliasCsb) {
		var csb;
		if(!aliasCsb){
			csb = utils.readMasterCsb(pin);
		}else{
			csb = utils.getCsb(pin, aliasCsb);
		}
		if(csb.data["records"] && csb.data["records"]["Csb"] && csb.data["records"]["Csb"].length){
			var csbs = csb.data["records"]["Csb"];
			this.listCsbs(csbs, 0);
		}else{
			console.log("No csb exists");
		}
	},
	listCsbs: function (csbs, currentCsb) {
		if(currentCsb < csbs.length) {
			var csb = csbs[currentCsb];
			console.log(csb["Title"]);
			var csbData = utils.readCsb(csb["Path"], Buffer.from(csb["Dseed"], "hex"));
			if (csbData["records"] && csbData["records"]["Csb"]) {
				csbs = csbs.concat(csbData["records"]["Csb"]);
			}
			this.listCsbs(csbs, currentCsb + 1);
		}
	}
});