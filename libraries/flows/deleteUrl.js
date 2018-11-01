var path = require("path");

const utils = require("./../../utils/flowsUtils");


$$.swarm.describe("delete", {
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
				self.processUrl(pin, self.url);
			}
		})
	},
	processUrl: function (pin, url) {
		var self = this;

		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to traverse url");
				return;
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to get child csb");
					return;
				}
				self.csb = csb;
				self.recordType = args.shift();
				self.key = args.shift();
				self.field = args.shift();

				self.prepareDeletion();
			});
		});
	},
	prepareDeletion: function () {
		var self = this;
		if (!self.recordType) {
			this.swarm("interaction", "handleError", null, "The provided record type could not be found", true);
			return;
		}
		if (!(this.csb && this.csb.Data && this.csb.Data["records"] && this.csb.Data["records"][this.recordType] && this.csb.Data["records"][this.recordType].length>0)) {
			this.swarm("interaction", "handleError", null, "No records of type "+ this.recordType + " exist ", true);
			return;
		}
		if (!this.key) {
			this.swarm("interaction", "confirmDeletion", this.recordType);
		} else {
			this.deleteRecord();
		}

	},
	deleteRecord: function () {
		var indexRecord = utils.indexOfRecord(this.csb.Data, this.recordType, this.key);
		if(indexRecord < 0){
			this.swarm("interaction", "handleError", null, "The provided record type could not be found", true);
			return;
		}
		var record = this.csb.Data["records"][this.recordType][indexRecord];
		if(this.field){
			if(record[this.field]){
				record[this.field] = "";
			}else{
				this.swarm("interaction", "handleError", null, "The provided field could not be found", true);
			}
		}else{
			this.csb.Data["records"][this.recordType].splice(indexRecord, 1);
		}
		this.saveModifiedCsb(this.csb);
	},
	deleteMultipleRecords: function () {
		this.csb.Data["records"][this.recordType] = [];
		this.saveModifiedCsb(this.csb);
	},
	saveModifiedCsb: function (csb) {
		var self = this;
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
			if(err) {
				self.swarm("interaction", "handleError", err, "Failed to write csb " + csb.Title);
				return;
			}
			self.swarm("interaction", "printInfo", "Deleted successfully");
		});
	}
});