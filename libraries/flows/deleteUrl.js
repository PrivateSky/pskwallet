var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));


$$.flow.describe("deleteUrl", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url);
		})
	},
	processUrl: function (pin, url) {
		var args = utils.traverseUrl(pin, url);
		var parentCsb = args.shift();
		var csb = utils.getChildCsb(parentCsb, args.shift());
		args.unshift(csb);
		this.deleteRecord(...args);
		
	},
	deleteRecord: function (csb, recordType, key, field) {
		if (!recordType) {
			console.log("Nothing to remove");
			return;
		}
		if (!key) {
			var prompt = "You are  about to delete all records of type " + recordType + " from csb " + csb.Title;
			utils.confirmOperation(prompt, null, function (err, rl) {
				if (csb && csb.Data && csb.Data["records"] && csb.Data["records"][recordType]) {
					csb.Data["records"][recordType] = [];
				}
			})
		} else {
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord < 0){
				console.log("The provided record does not exist");
				return;
			}
			var record = csb.Data["records"][recordType][indexRecord];
			if(field){
				if(record[field]){
					record[field] = "";
				}else{
					console.log("The provided field does not exist");
					return;
				}
			}else{
				csb.Data["records"][recordType].splice(indexRecord, 1);
			}
		}
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});