var path = require("path");
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
var fs = require("fs");

$$.flow.describe("listCsbs", {
	start: function (aliasCsb) {
		aliasCsb = aliasCsb || null;
		var self = this;
		utils.masterCsbExists(function (err, status) {
			if(err){
				$$.interact.say("No csb exists");
			}else{
				utils.requirePin(null, function (err, pin) {
					self.getCsb(pin, aliasCsb, function (err, csb) {
						if(err){
							throw err;
						}else{
							console.log("---------csb:", csb);
						}
					});
				});
			}
		})

	},
	getCsb: function (pin, aliasCsb, callback) {
		// utils.getCsb(pin, aliasCsb, callback);
		var self = this;

		if(!aliasCsb){
			utils.loadMasterCsb(pin, null, function (err, masterCsb) {
				if(err){
					return callback(err);
				}
				__processCsb(masterCsb, callback);
			});
		}else{
			utils.getCsb(pin, aliasCsb, function (err, csb) {
				if(err){
					return callback(err);
				}
				__processCsb(csb);

			});
		}
		function __processCsb(csb, callback) {
			if(csb.Data["records"] && csb.Data["records"]["Csb"] && csb.Data["records"]["Csb"].length){
				var csbs = csb.Data["records"]["Csb"];
				self.listCsbs(csbs, 0, function (err) {
					if(err){
						callback(err);
					}
				});
			}else{
				$$.interact.say("No csb exists");
			}
		}

	},
	listCsbs: function (csbs, currentCsb, callback) {
		var self = this;
		if(currentCsb < csbs.length) {
			var csb = csbs[currentCsb];
			$$.interact.say(csb["Title"]);
			utils.readCsb(csb.Path,csb.Dseed, function (err, csbData) {
				if(err){
					return callback(err);
				}
				if (csbData["records"] && csbData["records"]["Csb"]) {
					csbs = csbs.concat(csbData["records"]["Csb"]);
				}
				self.listCsbs(csbs, currentCsb + 1, callback);
			});

		}
	}
});