var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("getRecord", {
	start: function (aliasCsb, recordType, key, field) {
		utils.requirePin([aliasCsb, recordType, key, field], null, this.getRecord);
	},
	getRecord: function (pin, aliasCsb, recordType, key, field) {
		var masterCsb = utils.readMasterCsb(pin);
		var indexCsb = utils.indexOfRecord(masterCsb.data, "Csb", aliasCsb);
		if(indexCsb >= 0)
		{
			var csbInMaster  = masterCsb.data["records"]["Csb"][indexCsb];
			var encryptedCsb = utils.readEncryptedCsb(csbInMaster["Path"]);
			var dseed        = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
			var csb          = crypto.decryptJson(encryptedCsb, dseed);
			var indexKey = utils.indexOfKey(csb["records"][recordType], "Title", key);
			if(indexKey >= 0) {
				if (!field) {
					console.log(csb["records"][recordType][indexKey]);
				} else if (csb["records"][recordType][indexKey][field]) {
					console.log(csb["records"][recordType][indexKey][field]);
				} else {
					console.log("The record type", recordType, "does not have a field", field);
				}
			}else{
				console.log("No record having the key", key, "exists in", aliasCsb);
			}
		}else{
			console.log("A csb with the provided alias does not exist");
		}
	}
});