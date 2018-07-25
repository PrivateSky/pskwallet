var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("getUrl", {
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
				this.printCsb(splitUrl[0]);
				break;
			case 2:
			case 3:
				this.getRecord(splitUrl[0], splitUrl[1], splitUrl[2]);
				break;
			case 4:
				this.getField();
				break;
			default:
				console.log("Don't know what to do");
		}
	},
	printCsb: function (aliasCsb) {
		$$.flow.create("flows.printCsb").start(aliasCsb);
	},
	getRecord: function (aliasCsb, recordType, key) {
		$$.flow.create("flows.getRecord").start(aliasCsb, recordType, key);
	},
	getField: function () {
		throw new Error("Not implemented");
	}
});