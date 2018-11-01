var path = require("path");

const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");

$$.swarm.describe("setUrl", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin", 3);
	},
	readPin: "interaction",

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
				args.unshift(csb);
				self.readStructure(...args);
			});
		});


	},
	readStructure: function (csb, recordType, key, field) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to get record " + recordType + " structure");
				return;
			}
			var fields = recordStructure["fields"];
			self.checkInputValidity(csb, recordType, key, field, fields);
		});
	},
	checkInputValidity: function (csb, recordType, key, field, fields) {
		var self = this;
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
	},

	addRecord: function (record, csb, recordType, key, field) {
		var self = this;
		utils.addRecord(record, csb, recordType, key, field, function (err) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to add record");
				return;
			}
			self.swarm("interaction", "printInfo", "The record was successfully added to csb " + csb.Title);
		})
	}

});
