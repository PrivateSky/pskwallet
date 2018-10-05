var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.flow.describe("setKey", {
	start: function (aliasCsb, recordType, key, field) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.readStructure(pin, aliasCsb, recordType, key, field, function (err, record) {
				if(err){
					console.log( err);
				}
			});
		})
	},
	readStructure: function (pin, aliasCsb, recordType, key, field, callback) {
		var self = this;
		utils.getRecordStructure(recordType, function (err, recordStructure) {
			var fields = recordStructure["fields"];
			utils.getCsb(pin, aliasCsb, function (err, csb) {
				if(err){
					return callback(err);
				}
				if(!csb){
					$$.interact.say("No csb with the alias", aliasCsb ,"exists");
					return;
				}
				self.checkInputValidity(pin, aliasCsb, recordType, key, field, fields, csb, callback);
			});
		});
	},
	checkInputValidity: function (pin, aliasCsb, recordType, key, field, fields, csb, callback) {
		var self = this;
		if(key){
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord >= 0){
				var prompt = "Do you want to continue?";
				if(!field){
					$$.interact.say("You are about to overwrite the following record:");
					$$.flow.start("flows.getKey").getKey(pin, aliasCsb, recordType, key, null, function (err, record) {
						if(err){
							return callback(err);
						}
						// console.log(record);
						utils.confirmOperation(prompt, null, function(err, rl){
							if(err){
								return callback(err);
							}
							utils.enterRecord(fields, 0, null, rl, function (err, record) {
								if(err){
									return callback(err);
								}
								self.addRecord(pin, record, csb, recordType, key, field, callback)
							});
						});
					});
				}
				else {
					var indexField = utils.indexOfKey(fields, "fieldName", field);
					if (indexField < 0) {
						$$.interact.say("The record type", recordType, "does not have a field", field);
					} else {
						$$.interact.say("You are about to overwrite the following field:");
						$$.flow.start("flows.getKey").getKey(pin, aliasCsb, recordType, key, field, function (err, record) {
							if(err){
								return callback(err);
							}
							// console.log(record);
							utils.confirmOperation(prompt, function(err, rl){
								if(err){
									return callback(err);
								}
								utils.enterField(field, rl, function(err, answer){
									if(err){
										return callback(err);
									}
									self.addRecord(pin, answer, csb, recordType, key, field, callback);
								})
							});
						});
					}
				}
			}else {
				$$.interact.say("No record of type", recordType, "having the key", key, "could be found in", aliasCsb);
			}
		}else if(!key && !field) {
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				if(err){
					return callback(err);
				}
				self.addRecord(pin, record, csb, recordType, key, field, callback);
			});
		}
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