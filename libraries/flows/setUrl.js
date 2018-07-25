var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
// $$.requireLibrary("flows");

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
				this.addCsb(splitUrl[0]);
				break;
			case 2:
			case 3:
				this.addRecord(splitUrl[0], splitUrl[1], splitUrl[2]);
				break;
			case 4:

			default:
				console.log("don't know what to do");
		}
		// if (splitUrl[0]) {
		// 	if (masterCsb.csbData["records"] && masterCsb.csbData["records"]["Csb"]) {
		// 		for (var c in masterCsb.csbData["records"]["Csb"]) {
		// 			if (masterCsb.csbData["records"]["Csb"][c]["Alias"] == splitUrl[0]) {
		// 				var csbInMaster = masterCsb.csbData["records"]["Csb"][c];
		// 				var encryptedCsb = utils.readEncryptedCsb(csbInMaster["Path"]);
		// 				var dseed = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
		// 				var csb = crypto.decryptJson(encryptedCsb, dseed);
		// 				if(splitUrl[1])
		// 			}
		// 		}
		// 		if(c == masterCsb.csbData["records"]["Csb"].length){
		// 			console.log("No csb with the provided alias exists");
		// 		}
		// 	}
		// }else{
		// 	console.log("No csbAlias inserted");
		// }
	},
	addCsb: function (aliasCsb) {
		$$.flow.create("flows.addCsb").start(aliasCsb);
	},
	addRecord: function (aliasCsb, recordType, key) {
		$$.flow.create("flows.setRecord").start(aliasCsb, recordType, key);
	},
	setField: function () {

	}
});