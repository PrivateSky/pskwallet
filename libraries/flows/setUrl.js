var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url);
		});
	},
	processUrl: function (pin, url) {
		var args = utils.traverseUrl(pin, url);
		if(!args){
			console.log("Invalid Url");
			return;
		}
		var parentCsb = args.shift();
		var csb = utils.getChildCsb(parentCsb, args[0]);
		// console.log(args[0]);
		// args.shift();
		args.unshift(csb);
		args.unshift(pin);
		console.log(args);
		this.readStructure(...args);
	},
	readStructure: function (pin, csb, aliasCsb, recordType, key, field) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		$$.flow.create("flows.setKey").checkInputValidity(pin, aliasCsb, recordType, key, field, fields, csb);
	}
	
});
