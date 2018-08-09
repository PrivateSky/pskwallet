var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("printCsb", {
	start: function (aliasCsb) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.printCsb(pin, aliasCsb);
		});
	},
	printCsb: function (pin, aliasCsb) {
		var csb;
		if(!aliasCsb){
			csb = utils.readMasterCsb(pin);
		}else{
			csb = utils.getCsb(pin, aliasCsb);
		}
		if(!csb.Data || !csb.Data["records"] || Object.keys(csb.Data["records"]).length === 0 ){
			console.log("There aren't any csbs in the current folder");
			return;
		}
		console.log(csb.Data["records"]);
	}
});