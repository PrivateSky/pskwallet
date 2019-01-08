var path = require("path");

const utils = require("./../../utils/flowsUtils");
$$.swarm.describe("setKey", {
	start: function (aliasCsb, recordType, key, field) {
		this.aliasCsb 	= aliasCsb;
		this.recordType = recordType;
		this.key 		= key;
		this.field 		= field;
		this.swarm("interaction", "readPin", 3);
	},

	readPin: "interaction",

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.readStructure(pin);
			}
		})
	},

	readStructure: function (pin, csb, recordType, key, field) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to get record " + recordType + " structure");
				return;
			}
			var fields = recordStructure["fields"];
			self.checkInputValidity(pin, csb, recordType, key, field, fields);
		});
	},
	checkInputValidity: function (pin, aliasCsb, recordType, key, field, fields) {
		var self = this;
		utils.getCsb(pin, aliasCsb, function (err, csb) {
			if (err) {
				self.swarm("interaction", "handleError", err, "Failed to get csb "+aliasCsb);
				return;
			}
			if (!csb) {
				self.swarm("interaction", "handleError", null, "The csb " + aliasCsb +"does not exist",true);
				return;
			}
			if(key){
				var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
				if(indexRecord >= 0){
					if(!field){
						self.swarm("interaction", "confirmOverwrite", csb, recordType, key, field, fields, utils.getRecord);
					}
					else {
						var indexField = utils.indexOfKey(fields, "fieldName", field);
						if (indexField < 0) {
							self.swarm("interaction", "handleError", null, "The field "+ field + " could not be found", true);
						} else {
							self.swarm("interaction", "confirmOverwrite", csb, recordType, key, field, fields, utils.getRecord);
						}
					}
				}else {
					self.swarm("interaction", "handleError", null, "The record "+ recordType + " could not be found", true);
				}
			}else if(!key && !field) {
				self.swarm("interaction", "enterRecord", csb, recordType, key, field, fields);
			}
		});
	},

	addRecord: function (pin, record, csb, recordType, key, field, callback) {
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
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
			if(err){
				return callback(err);
			}
			console.log("Done");
		});
	}
});