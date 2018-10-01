var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");

$$.flow.describe("addCsb", {
	start: function (parentUrl, aliasCsb) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.addCsb(pin, parentUrl, aliasCsb);
		});
	},
	addCsb: function (pin, parentUrl, aliasCsb, callback) {
		if(!fs.existsSync(path.join(process.cwd(), aliasCsb))){
			$$.interact.say('No csb having the alias', aliasCsb, "exists.");
			return;
		}
		utils.loadMasterCsb(pin, function (err, masterCsb) {
			if(err){
				callback(err);
				return;
			}
		});
		var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, parentUrl);
		var parentCsb = parentChildCsbs[0];
		var childCsb = fs.readFileSync(path.join(process.cwd(), aliasCsb));
		if(!parentCsb["records"]){
			parentCsb["records"] = {};
		}
		if(!parentCsb.Data["records"]["Csb"]){
			parentCsb.Data["records"]["Csb"] = [];
		}
		parentCsb.Data["records"]
	}
});