var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("setRecord", {
	start: function (aliasCsb, recordType, key, field) {
		utils.requirePin([aliasCsb, recordType, key, field], null, this.readStructure)
	},
	readStructure: function (pin, aliasCsb, recordType, key, field) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		if(key){
			if(!field){
				this.enterRecord(pin, aliasCsb, recordType, key, fields, 0)
			}
			else {
				var indexField = utils.indexOfKey(fields, "fieldName", field);
				if (indexField < 0) {
					console.log("The record type", recordType, "does not have a field", field);
				} else {
					this.enterField(pin, aliasCsb, recordType, key, field);
				}
			}
		}else if(!key && !field) {
			this.enterRecord(pin, aliasCsb, recordType, fields, 0);
		}
	},
	enterField: function (pin, aliasCsb, recordType, key, field) {
		utils.enterField(pin, aliasCsb, recordType, key, field, null, this.addRecord);
	},
	enterRecord: function (pin, aliasCsb, recordType, key, fields, currentField) {
		var record = {};
		utils.enterRecord(pin, aliasCsb, recordType, key, fields, record, currentField, null, this.addRecord);
	},
	addField: function (pin, aliasCsb, recordType, key, field, valueInserted) {
		var masterCsb = utils.readMasterCsb(pin);
		var indexCsb = utils.indexOfRecord(masterCsb.csbData, "Csb", aliasCsb);
		if(indexCsb >= 0){
			var csbInMaster  = masterCsb.csbData["records"]["Csb"][indexCsb];
			var encryptedCsb = utils.readEncryptedCsb(csbInMaster["Path"]);
			var dseed        = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
			var csb          = crypto.decryptJson(encryptedCsb, dseed);
			if (!csb["records"]) {
				csb["records"] = {};
			}
			if(!csb["records"][recordType]) {
				csb["records"][recordType] = [];
			}
			else{
				var indexKey = utils.indexOfKey(csb["records"][recordType], "Title", key);
				if(indexKey >= 0){
					csb["records"][recordType][indexKey][field] = valueInserted;

				}else{
					console.log("No record having the title", key, "exists in", aliasCsb);
				}
			}
			utils.writeCsbToFile(csbInMaster["Path"], csb, dseed);
		}else{
			console.log("A csb with the provided alias does not exist");
		}
	},
	addRecord: function (pin, aliasCsb, recordType, key, field, record) {
		var masterCsb = utils.readMasterCsb(pin);
		var indexCsb = utils.indexOfRecord(masterCsb.csbData, "Csb", aliasCsb);
		if(indexCsb >= 0){
			var csbInMaster  = masterCsb.csbData["records"]["Csb"][indexCsb];
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
		}else{
			console.log("A csb with the provided alias does not exist");
		}
	}

});