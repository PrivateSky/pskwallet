var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");

$$.flow.describe("listCsbs", {
	start: function (aliasCsb) {
		var self = this;
		if(!utils.masterCsbExists()){
			console.log("No csb exists");
		}else{
			utils.requirePin(null, function (err, pin) {
				self.getCsb(pin, aliasCsb);
			});
		}
	},
	getCsb: function (pin, aliasCsb) {
		var csb;
		if(!aliasCsb){
			csb = utils.readMasterCsb(pin);
		}else{
			csb = utils.getCsb(pin, aliasCsb);
		}
		if(csb.Data["records"] && csb.Data["records"]["Csb"] && csb.Data["records"]["Csb"].length){
			var csbs = csb.Data["records"]["Csb"];
			this.listCsbs(csbs, 0);
		}else{
			console.log("No csb exists");
		}
	},
	listCsbs: function (csbs, currentCsb) {
		if(currentCsb < csbs.length) {
			var csb = csbs[currentCsb];
			console.log(csb["Title"]);
			var csbData = utils.readCsb(csb["Path"],csb["Dseed"]);
			if (csbData["records"] && csbData["records"]["Csb"]) {
				csbs = csbs.concat(csbData["records"]["Csb"]);
			}
			this.listCsbs(csbs, currentCsb + 1);
		}
	}
});