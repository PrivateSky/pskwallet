var path = require("path");

const utils = require(path.resolve(__dirname + "/../../utils/flowsUtils"));
const crypto = require("pskcrypto");
var fs = require("fs");

$$.flow.describe("addCsb", {
	start: function (parentUrl, alias) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.addCsb(pin, parentUrl, alias, function (err) {
				if(err) throw err;
			});
		});
	},
	addCsb: function (pin, parentUrl, alias, callback) {
		utils.getCsb(pin, alias, function (err, csb) {
			fs.access(path.join(process.cwd(), csb.Path), null, function (err) {
				if(err){
					$$.interact.say('No csb having the alias', alias, "exists.");
					return;
				}
				utils.loadMasterCsb(pin, null, function (err, masterCsb) {
					if(err){
						callback(err);
						return;
					}
				});
				var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, parentUrl);
				var parentCsb = parentChildCsbs[0];
				var childCsb = fs.readFileSync(path.join(process.cwd(), alias));
				if(!parentCsb["records"]){
					parentCsb["records"] = {};
				}
				if(!parentCsb.Data["records"]["Csb"]){
					parentCsb.Data["records"]["Csb"] = [];
				}
				parentCsb.Data["records"]
			});
			});


	}
});