var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.flow.describe("setRecord", {
	start: function (aliasCsb, recordType, key, field) {
		utils.requirePin([aliasCsb, recordType, key, field], null, this.readStructure)
	},
	readStructure: function (pin, aliasCsb, recordType, key, field) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		var csb = utils.getCsb(pin, aliasCsb);
		if(!csb){
			console.log("No csb with the alias", aliasCsb ,"exists");
			return;
		}
		if(key){
			var indexRecord = utils.indexOfRecord(csb.data, recordType, key);
			if(indexRecord >= 0){
				var prompt = "Do you want to continue?";
				if(!field){
					console.log("You are about to overwrite the following record:");
					$$.flow.create("flows.getKey").getKey(pin, aliasCsb, recordType, key);
					utils.confirmOperation([pin, csb, recordType, key, fields, 0, null], prompt, this.enterRecord);
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						console.log("The record type", recordType, "does not have a field", field);
					} else {
						console.log("You are about to overwrite the following field:");
						$$.flow.create("flows.getKey").getKey(pin, aliasCsb, recordType, key, field);
						utils.confirmOperation([pin, csb, recordType, key, field, null], prompt, this.enterField);
					}
				}
			}
			console.log("No record of type", recordType, "having the key", key, "could be found in", aliasCsb);
		}else if(!key && !field) {
			this.enterRecord(pin, csb, recordType, key, fields, 0);
		}
	},
	enterField: function (pin, aliasCsb, recordType, key, field) {
		utils.enterField(pin, aliasCsb, recordType, key, field, null, null, this.addRecord);
	},
	enterRecord: function (pin, csb, recordType, key, fields, currentField) {
		var record = {};
		utils.enterRecord(pin, csb, recordType, key, fields, record, currentField, null, this.addRecord);
	},
	addRecord: function (pin, csb, recordType, key, field, record) {
		if (!csb.data["records"]) {
			csb.data["records"] = {};
		}
		if (!csb.data["records"][recordType]) {
			csb.data["records"][recordType] = [];
			csb.data["records"][recordType].push(record);
		} else {
			if (key) {
				var indexKey = utils.indexOfRecord(csb.data, recordType, key);
				if(field){
					csb.data["records"][recordType][indexKey][field] = record;
				}else{
					csb.data["records"][recordType][indexKey] = record;
				}
			} else {
				csb.data["records"][recordType].push(record);
			}
		}
		utils.writeCsbToFile(csb.path, csb.data, csb.dseed);
	}

});