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
		utils.checkPinIsValid(pin, function (err, status) {
			if(err){
				console.log("Pin is invalid");
				console.log("Try again");
				self.swarm("interaction", "readPin", noTries-1);
			}else{
				self.processUrl(pin);
			}
		})
	},
	processUrl: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(err){
				return callback(err);
			}
			if(!args){
				self.swarm("interaction", "handleError");
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					throw err;
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
				throw err;
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
					self.swarm("interaction", "confirmOverwrite", csb, recordType, key, field, fields);
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						self.swarm("interaction", "handleError");
					} else {
						self.swarm("interaction", "confirmOverwrite", csb, recordType, key, field, fields);
					}
				}
			}else {
				self.swarm("interaction", "handleError");
			}
		}else if(!key && !field) {
			self.swarm("interaction", "enterRecord", csb, recordType, key, field, fields);
		}
	},
	addRecord: function (record, csb, recordType, key, field) {
		var self = this;
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
				throw err;
			}
			self.swarm("interaction", "onComplete");
		});
	}
});
