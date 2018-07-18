var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require(path.resolve(__dirname + "/../../../pskcrypto/cryptography"));
$$.flow.describe("getKey", {
	start: function (aliasCsb, recordType, keyName) {
		utils.enterPin([aliasCsb, recordType, keyName], 3, null, this.getKey);
	},
	getKey: function (pin, aliasCsb, recordType, keyName) {
		var masterCsb = utils.readMasterCsb(pin);
		if (masterCsb.csbData["records"] && masterCsb.csbData["records"]["Csb"]) {
			for (var c in masterCsb.csbData["records"]["Csb"]) {
				if (masterCsb.csbData["records"]["Csb"][c]["Alias"] == aliasCsb) {
					var csbInMaster  = masterCsb.csbData["records"]["Csb"][c];
					var encryptedCsb = utils.readCsb(csbInMaster["Path"]);
					var dseed        = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
					var csb          = crypto.decryptJson(encryptedCsb, dseed);
					for(var key in csb["records"][recordType]){
						if(csb["records"][recordType][key]["Title"] == keyName){
							console.log(csb["records"][recordType][key]);
							break;
						}
					}
					break;
				}
			}
			if(c == masterCsb.csbData["records"]["Csb"].length){
				throw new Error("A csb with the provided alias does not exist");
			}
		}
	}
});