var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");

$$.flow.describe("listCsbs", {
	start: function () {
		if(!utils.masterCsbExists()){
			console.log("No csb exists");
		}else{
			utils.requirePin(null, null, this.getMaster);
		}
	},
	getMaster: function (pin) {
		var masterCsb = utils.readMasterCsb(pin);
		if(masterCsb.csbData["records"] && masterCsb.csbData["records"]["Csb"] && masterCsb.csbData["records"]["Csb"].length){
			var csbs = masterCsb.csbData["records"]["Csb"];
			this.listCsbs(csbs, 0);
		}else{
			console.log("No csb exists");
		}
	},
	listCsbs: function (csbs, currentCsb) {
		if(currentCsb < csbs.length) {
			var csb = csbs[currentCsb];
			console.log(csb["Title"], "->", csb["Path"]);
			var csbData = utils.readCsb(csb["Path"], Buffer.from(csb["Dseed"], "hex"));
			if (csbData["records"] && csbData["records"]["Csb"]) {
				csbs = csbs.concat(csbData["records"]["Csb"]);
			}
			this.listCsbs(csbs, currentCsb + 1);
		}
	}
});