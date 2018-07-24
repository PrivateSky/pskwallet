var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("setKey", {
	start: function (aliasCsb, recordType) {
		this.readStructure(aliasCsb, recordType);
	},
	readStructure: function (aliasCsb, recordType) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		// var field = [];
		// if(keyName){
		// 	for(var f in fields){
		// 		if(fields[f]["fieldName"] == keyName){
		// 			field.push(fields[f]);
		// 			break;
		// 		}
		// 	}
		// }else{
		// 	field = fields;
		// }
		utils.requirePin([aliasCsb, recordType, fields, 0], this.enterFields);
	},
	enterFields: function (pin, aliasCsb, recordType, fields, currentField) {
		var record = {};
		utils.enterField(pin, aliasCsb, recordType, fields, record, currentField, null, this.addKey);
	},
	addKey: function (pin, aliasCsb, recordType, record) {
		var masterCsb = utils.readMasterCsb(pin);
		if (masterCsb.csbData["records"] && masterCsb.csbData["records"]["Csb"]) {
			for (var c in masterCsb.csbData["records"]["Csb"]) {
				if (masterCsb.csbData["records"]["Csb"][c]["Alias"] == aliasCsb) {
					var csbInMaster  = masterCsb.csbData["records"]["Csb"][c];
					var encryptedCsb = utils.readEncryptedCsb(csbInMaster["Path"]);
					var dseed        = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
					var csb          = crypto.decryptJson(encryptedCsb, dseed);
					if (!csb["records"]) {
						csb["records"] = {};
					}
					if(!csb["records"][recordType]){
						csb["records"][recordType] = [];
					}
					csb["records"][recordType].push(record);
					utils.writeCsbToFile(csbInMaster["Path"], csb, dseed);
					break;
				}
			}
			if(c == masterCsb.csbData["records"]["Csb"].length){
				throw new Error("A csb with the provided alias does not exist");
			}
		}
	}
});