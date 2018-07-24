var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");
$$.requireModule('psk-http-client');

$$.flow.describe("restore", {
	public: {
		url: "string"
	},
	start: function () {
		this.url  = "http://localhost:8080";
		utils.enterSeed(this.restoreMaster);
	},
	restoreMaster: function (seed) {
		// var masterCsb = utils.readMasterCsb(pin);
		// var csbs = masterCsb.csbData["records"]["Csb"];
		// var encryptedMaster = fs.readFileSync(utils.paths.masterCsb);
		var self = this;
		$$.remote.doHttpGet(this.url + "/CSB/master", function (err, res) {
			if(err){
				throw err;
			}else{
				var dseed = crypto.deriveSeed(seed);
				var encryptedMaster = Buffer.from(res, 'hex');
				console.log(typeof encryptedMaster);
				fs.writeFileSync(utils.paths.masterCsb, encryptedMaster);
				crypto.saveDSeed(dseed, utils.defaultPin, utils.paths.dseed);
				var masterCsb = crypto.decryptJson(encryptedMaster, dseed);
				// fs.writeFileSync(utils.paths.recordStructures + "/test_csb_master.json", JSON.stringify(masterCsb,null, "\t"));
				var csbs = masterCsb["records"]["Csb"];
				self.restoreCsbs(csbs, 0);
			}
		});
	},
	restoreCsbs: function(csbs, currentCsb){
		var self = this;
		if(currentCsb == csbs.length){
			console.log("All csbs have been restored");
		}else{
			$$.remote.doHttpGet(this.url + "/CSB/" + csbs[currentCsb]["Path"], function(err, res){
				if(err){
					throw err;
				}else{
					var encryptedCsb = Buffer.from(res, "hex");
					fs.writeFileSync(csbs[currentCsb]["Path"], encryptedCsb);
					self.restoreCsbs(this.url, csbs, currentCsb + 1);
				}
			})
		}
	}

});

