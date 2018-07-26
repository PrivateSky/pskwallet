var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("setRecord", {
	start: function (aliasCsb, recordType, key) {
		this.readStructure(aliasCsb, recordType, key);
	},
	readStructure: function (aliasCsb, recordType, key) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		if(key) {
			utils.requirePin([aliasCsb, recordType, key, fields, 1], this.enterFields);
		}else{
			utils.requirePin([aliasCsb, recordType, key, fields, 0], this.enterFields);
		}
	},
	enterFields: function (pin, aliasCsb, recordType, key, fields, currentField) {
		if(key){
			var record = {"Title": key};
		}else{
			var record = {};
		}

		utils.enterField(pin, aliasCsb, recordType, key, fields, record, currentField, null, this.addRecord);
	},
	addRecord: function (pin, aliasCsb, recordType, key, record) {
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
					if(key){
						for(var rec in csb["records"][recordType]){
							if(csb["records"][recordType][rec] == key){
								for(var field in csb["records"][recordType][rec]){
									if(csb["records"][recordType][rec][field] != record[field]){
										csb["records"][recordType][rec][field] = record[field];
									}
								}
								console.log("A", recordType, "record has been added in", aliasCsb);
								return;
							}
						}
						console.log("A record having the provided key could not be found");
					}else {
						csb["records"][recordType].push(record);
					}
					utils.writeCsbToFile(csbInMaster["Path"], csb, dseed);

				}
			}
			if(c == masterCsb.csbData["records"]["Csb"].length){
				console.log("A csb with the provided alias does not exist");
			}
		}
	}
});