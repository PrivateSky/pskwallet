var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = aliasCsb/recordType/key/field
		this.processUrl(url);
	},
	processUrl: function (url) {
		var splitUrl = url.split("/");
		switch(splitUrl.length){
			case 0:
				console.log("No url inserted");
				break;
			case 1:
				console.log("Nothing to do");
				break;
			case 2:
			case 3:
				this.addRecord(splitUrl[0], splitUrl[1], splitUrl[2]);
				break;
			case 4:
				this.setField();
				break;
			default:
				console.log("Don't know what to do");
		}
	},
	addCsb: function (aliasCsb) {
		$$.flow.create("flows.addCsb").start(aliasCsb);
	},
	addRecord: function (aliasCsb, recordType, key) {
		$$.flow.create("flows.setRecord").start(aliasCsb, recordType, key);
	},
	setField: function () {
		throw new Error("Not implemented");
	}
});