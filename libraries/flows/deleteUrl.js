var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));


$$.flow.describe("deleteUrl", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url, function (err) {
				if(err) throw err;
			});
		})
	},
	processUrl: function (pin, url, callback) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				return callback(err);
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					return callback(err);
				}
				args.unshift(csb);
				self.deleteRecord(...args, callback);
			});
		});
	},
	deleteRecord: function (csb, recordType, key, field, callback) {
		if (!recordType) {
			$$.interact.say("Nothing to remove");
			return;
		}
		if (!key) {
			var prompt = "You are  about to delete all records of type " + recordType + " from csb " + csb.Title;
			utils.confirmOperation(prompt, null, function (err, rl) {
				if(err){
					return callback(err);
				}
				if (csb && csb.Data && csb.Data["records"] && csb.Data["records"][recordType]) {
					csb.Data["records"][recordType] = [];
				}
			})
		} else {
			var indexRecord = utils.indexOfRecord(csb.Data, recordType, key);
			if(indexRecord < 0){
				$$.interact.say("The provided record does not exist");
				return;
			}
			var record = csb.Data["records"][recordType][indexRecord];
			if(field){
				if(record[field]){
					record[field] = "";
				}else{
					$$.interact.say("The provided field does not exist");
					return;
				}
			}else{
				csb.Data["records"][recordType].splice(indexRecord, 1);
			}
		}
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
			if(err) {
				return callback(err);
			}
		});
	}
});