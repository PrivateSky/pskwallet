var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("addFile", {
	start: function (csbUrl, filePath) {
		if(!filePath){
			console.log("Child url is required.");
			return;
		}
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.addArchive(pin, csbUrl, filePath);
		});
	},
	addArchive: function (pin, csbUrl, filePath) {
		filePath = path.resolve(filePath);
		if(!fs.existsSync(filePath)){
			console.log(filePath, "is invalid.");
			return;
		}
		var masterCsb = utils.readMasterCsb(pin);
		var parentChildCsbs = utils.traverseUrl(pin, masterCsb.Data, csbUrl);
		if(!parentChildCsbs){
			console.log("Invalid url");
			return;
		}
		var csb = parentChildCsbs[1];

		if(!csb.Data["records"]){
			csb.Data["records"] = {};
		}
		var self = this;
		if(!csb.Data["records"]["Adiacent"]){
			csb.Data["records"]["Adiacent"] = [];
			if(!fs.existsSync(utils.Paths.Adiacent)){
				fs.mkdirSync(utils.Paths.Adiacent);
			}
		}
		var indexAdiacent = csb.Data["records"]["Adiacent"].indexOf(crypto.generateSafeUid(csb.Dseed, path.basename(filePath)));
		if(indexAdiacent >= 0){
			console.log("A file with the name", path.basename(filePath), "already exists in the current csb");
			var prompt = "Do you want to overwrite it ?";
			utils.confirmOperation(prompt, null, function (err, rl) {
				self.saveChildInCsb(filePath, csb);
			})
		}else{
			self.saveChildInCsb(filePath, csb);
		}



	},
	saveChildInCsb: function (filePath, csb) {
		crypto.encryptStream(filePath,path.join(utils.Paths.Adiacent, crypto.generateSafeUid(csb.Dseed, path.basename(filePath))), csb.Dseed);
		csb.Data["records"]["Adiacent"].push(crypto.generateSafeUid(csb.Dseed, path.basename(filePath)));
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});
