var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("getRecord", {
	start: function (aliasCsb, recordType, key) {
		utils.requirePin([aliasCsb, recordType, key], this.getRecord);
	},
	getRecord: function (pin, aliasCsb, recordType, key) {
		var masterCsb = utils.readMasterCsb(pin);
		if (masterCsb.csbData["records"] && masterCsb.csbData["records"]["Csb"]) {
			for (var c in masterCsb.csbData["records"]["Csb"]) {
				if (masterCsb.csbData["records"]["Csb"][c]["Alias"] == aliasCsb) {
					var csbInMaster  = masterCsb.csbData["records"]["Csb"][c];
					var encryptedCsb = utils.readEncryptedCsb(csbInMaster["Path"]);
					var dseed        = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
					var csb          = crypto.decryptJson(encryptedCsb, dseed);
					if(key) {
						for (var rec in csb["records"][recordType]) {
							if (csb["records"][recordType][rec]["Title"] == key) {
								console.log(csb["records"][recordType][rec]);
								return;
							}
						}
						console.log("The provided key does not exist");
					}else{
						console.log(csb["records"][recordType]);
					}
				}
			}
			if(c == masterCsb.csbData["records"]["Csb"].length){
				console.log("No csb with the provided alias exists");
			}
		}
	}

});