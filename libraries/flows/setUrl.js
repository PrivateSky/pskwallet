
const utils = require("./../../utils/flowsUtils");

$$.swarm.describe("setUrl", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.processUrl(pin);
			}
		})
	},
	processUrl: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to traverse url");
				return;
			}
			if(!args || (args.length > 5 && args.length < 2)){
				self.swarm("interaction", "handleError", null, "Invalid url", true);
				return;
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to obtain child csb");
					return;
				}
				self.csb = csb;
				self.readStructure(...args);
			});
		});


	},
	readStructure: function (recordType, key, field) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to get record " + recordType + " structure");
				return;
			}
			var fields = recordStructure["fields"];
			self.checkInputValidity(recordType, key, field, fields);
		});
	},
	checkInputValidity: function (recordType, key, field, fields) {
		var self = this;

		if(key){
			var indexRecord = utils.indexOfRecord(self.csb.Data, recordType, key);
			var owRecord = utils.getRecord(self.csb, recordType, key, field);
			if(indexRecord >= 0){
				if(!field){
					self.swarm("interaction", "confirmOverwrite", recordType, key, field, fields, owRecord);
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						self.swarm("interaction", "handleError", null, "The field "+ field + " could not be found", true);
					} else {
						self.swarm("interaction", "confirmOverwrite", recordType, key, field, fields, owRecord);
					}
				}
			}else {
				self.swarm("interaction", "handleError", null, "The record "+ recordType + " could not be found", true);
			}
		}else if(!key && !field) {
			self.swarm("interaction", "enterRecord", recordType, key, field, fields);
		}
	},

	addRecord: function (record, recordType, key, field) {
		var self = this;
		utils.addRecord(record, this.csb, recordType, key, field, function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to add record");
				return;
			}
			self.swarm("interaction", "printInfo", "The record was successfully added to csb " + self.csb.Title);
		})
	}

});
