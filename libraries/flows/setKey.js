var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.flow.describe("setKey", {
	start: function (aliasCsb, recordType, key, field) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.readStructure(pin, aliasCsb, recordType, key, field);
		})
	},
	readStructure: function (pin, aliasCsb, recordType, key, field) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		var csb = utils.getCsb(pin, aliasCsb);
		if(!csb){
			console.log("No csb with the alias", aliasCsb ,"exists");
			return;
		}
		this.checkInputValidity(pin, aliasCsb, recordType, key, field, fields, csb);

	},
	checkInputValidity: function (pin, aliasCsb, recordType, key, field, fields, csb) {
		var self = this;
		if(key){
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord >= 0){
				var prompt = "Do you want to continue?";
				if(!field){
					console.log("You are about to overwrite the following record:");
					$$.flow.create("flows.getKey").getKey(pin, aliasCsb, recordType, key);
					utils.confirmOperation(prompt, null, function(err, rl){
						utils.enterRecord(fields, 0, null, rl, function (err, record) {
							self.addRecord(pin, record, csb, recordType, key, field)
						});
					});
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						console.log("The record type", recordType, "does not have a field", field);
					} else {
						console.log("You are about to overwrite the following field:");
						$$.flow.create("flows.getKey").getKey(pin, aliasCsb, recordType, key, field);
						utils.confirmOperation(prompt, function(err, rl){
							utils.enterField(field, rl, function(err, answer){
								self.addRecord(pin, answer, csb, recordType, key, field);
							})
						});
					}
				}
			}else {
				console.log("No record of type", recordType, "having the key", key, "could be found in", aliasCsb);
				return;
			}
		}else if(!key && !field) {
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				self.addRecord(pin, record, csb, recordType, key, field);
			});
		}
	},
	addRecord: function (pin, record, csb, recordType, key, field) {
		if (!csb.Data["records"]) {
			csb.Data["records"] = {};
		}
		if (!csb.Data["records"][recordType]) {
			csb.Data["records"][recordType] = [];
			csb.Data["records"][recordType].push(record);
		} else {
			if (key) {
				var indexKey = utils.indexOfRecord(csb.Data, recordType, key);
				if(field){
					csb.Data["records"][recordType][indexKey][field] = record;
				}else{
					csb.Data["records"][recordType][indexKey] = record;
				}
			} else {
				csb.Data["records"][recordType].push(record);
			}
		}
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});