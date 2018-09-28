var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url);
		});
	},
	processUrl: function (pin, url) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(!args){
				$$.interact.say("Invalid Url");
				return;
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				args.unshift(csb);
				self.readStructure(...args);
			});
		});


	},
	readStructure: function (csb, recordType, key, field) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			var fields = recordStructure["fields"];
			self.checkInputValidity(csb, recordType, key, field, fields);
		});
	},
	checkInputValidity: function (csb, recordType, key, field, fields) {
		var self = this;
		if(key){
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord >= 0){
				var prompt = "Do you want to continue?";
				if(!field){
					$$.interact.say("You are about to overwrite the following record:");
					$$.interact.say($$.flow.create("flows.getUrl").__getRecord(csb, recordType, key));
					utils.confirmOperation(prompt, null, function(err, rl){
						utils.enterRecord(fields, 0, null, rl, function (err, record) {
							self.addRecord(record, csb, recordType, key, field)
						});
					});
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						$$.interact.say("The record type", recordType, "does not have a field", field);
					} else {
						$$.interact.say("You are about to overwrite the following field:");
						$$.interact.say($$.flow.create("flows.getUrl").__getRecord(csb, recordType, key, field));
						utils.confirmOperation(prompt, function(err, rl){
							utils.enterField(field, rl, function(err, answer){
								self.addRecord(answer, csb, recordType, key, field);
							})
						});
					}
				}
			}else {
				$$.interact.say("No record of type", recordType, "having the key", key, "could be found in", csb.Title);
				return;
			}
		}else if(!key && !field) {
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				self.addRecord(record, csb, recordType, key, field);
			});
		}
	},
	addRecord: function (record, csb, recordType, key, field) {
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
			if(!err){
				console.log("Done");
			}
		});
	}
	
});
