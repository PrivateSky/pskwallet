var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
$$.swarm.describe("setKey", {
	start: function (aliasCsb, recordType, key, field) {
		console.log("start", arguments);
		this.swarm("interaction", "readPin", aliasCsb, recordType, key, field, 3);
	},

	readPin: "interaction",

	validatePin: function (pin ,aliasCsb, recordType, key, field, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				console.log("Invalid pin");
				console.log("Try again");
				self.swarm("interaction", "readPin", aliasCsb, recordType, key, field, noTries-1);
			}else {
				self.swarm("interaction", "readStructure", pin, aliasCsb, recordType, key, field);
			}
		})
	},

	readStructure: "interaction",

	checkInputValidity: function (pin, aliasCsb, recordType, key, field, fields) {
		var self = this;
		utils.getCsb(pin, aliasCsb, function (err, csb) {
			if (err) {
				throw err;
			}
			if (!csb) {
				self.swarm("interaction", "printError");
				return;
			}
			if (key) {
				var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
				if (indexRecord >= 0) {
					var prompt = "Do you want to continue?";
					if (!field) {
						console.log("You are about to overwrite the following record:");
						$$.flow.start("flows.getKey").getKey(pin, aliasCsb, recordType, key, null, function (err, record) {
							if (err) {
								throw(err);
							}
							// console.log(record);
							utils.confirmOperation(prompt, null, function (err, rl) {
								if (err) {
									throw err;
								}
								utils.enterRecord(fields, 0, null, rl, function (err, record) {
									if (err) {
										throw err;
									}
									self.addRecord(pin, record, csb, recordType, key, field, callback)
								});
							});
						});
					}
					else {
						var indexField = utils.indexOfKey(fields, "fieldName", field);
						if (indexField < 0) {
							console.log("The record type", recordType, "does not have a field", field);
						} else {
							console.log("You are about to overwrite the following field:");
							$$.flow.start("flows.getKey").getKey(pin, aliasCsb, recordType, key, field, function (err, record) {
								if (err) {
									return callback(err);
								}
								// console.log(record);
								utils.confirmOperation(prompt, function (err, rl) {
									if (err) {
										return callback(err);
									}
									utils.enterField(field, rl, function (err, answer) {
										if (err) {
											return callback(err);
										}
										self.addRecord(pin, answer, csb, recordType, key, field, callback);
									})
								});
							});
						}
					}
				} else {
					console.log("No record of type", recordType, "having the key", key, "could be found in", aliasCsb);
				}
			} else if (!key && !field) {
				utils.enterRecord(fields, 0, null, null, function (err, record) {
					if (err) {
						return callback(err);
					}
					self.addRecord(pin, record, csb, recordType, key, field, callback);
				});
			}
		});
	},
	printError: "interaction",
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