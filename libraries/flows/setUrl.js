var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url, function (err) {
				if(err){
					throw err;
				}
			});
		});
	},
	processUrl: function (pin, url, callback) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				return callback(err);
			}
			if(!args){
				$$.interact.say("Invalid Url");
				return;
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					return callback(err);
				}
				args.unshift(csb);
				self.readStructure(...args);
			});
		});


	},
	readStructure: function (csb, recordType, key, field, callback) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			if(err){
				return callback(err);
			}
			var fields = recordStructure["fields"];
			self.checkInputValidity(csb, recordType, key, field, fields, callback);
		});
	},
	checkInputValidity: function (csb, recordType, key, field, fields, callback) {
		var self = this;
		if(key){
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord >= 0){
				var prompt = "Do you want to continue?";
				if(!field){
					$$.interact.say("You are about to overwrite the following record:");
					$$.interact.say($$.flow.start("flows.getUrl").__getRecord(csb, recordType, key));
					utils.confirmOperation(prompt, null, function(err, rl){
						utils.enterRecord(fields, 0, null, rl, function (err, record) {
							if(err){
								return callback(err);
							}
							self.addRecord(record, csb, recordType, key, field, callback)
						});
					});
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						$$.interact.say("The record type", recordType, "does not have a field", field);
					} else {
						$$.interact.say("You are about to overwrite the following field:");
						$$.interact.say($$.flow.start("flows.getUrl").__getRecord(csb, recordType, key, field));
						utils.confirmOperation(prompt, function(err, rl){
							if(err){
								return callback(err);
							}
							utils.enterField(field, rl, function(err, answer){
								if(err){
									return callback(err);
								}
								self.addRecord(answer, csb, recordType, key, field, callback);
							})
						});
					}
				}
			}else {
				$$.interact.say("No record of type", recordType, "having the key", key, "could be found in", csb.Title);
			}
		}else if(!key && !field) {
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				if(err){
					return callback(err);
				}
				self.addRecord(record, csb, recordType, key, field, callback);
			});
		}
	},
	addRecord: function (record, csb, recordType, key, field, callback) {
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
