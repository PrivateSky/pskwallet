var path = require("path");

const utils = require(path.resolve(__dirname + "/../../utils/flowsUtils"));
const crypto = require("pskcrypto");
$$.flow.describe("printCsb", {
	start: function (aliasCsb) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.printCsb(pin, aliasCsb);
		});
	},
	printCsb: function (pin, aliasCsb) {
		var self = this;
		if(!aliasCsb){
			utils.loadMasterCsb(pin, self.__processCsb);
		}else{
			 utils.getCsb(pin, aliasCsb, self.__processCsb);
		}
	},
	__processCsb: function (err, csb) {
		if(err){
			throw err;
		}
		if(!csb.Data || !csb.Data["records"] || Object.keys(csb.Data["records"]).length === 0 ){
			$$.interact.say("There aren't any csbs in the current folder");
			return;
		}
		$$.interact.say(csb.Data["records"]);
	}
});