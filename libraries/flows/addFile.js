var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("addFile", {
	start: function (url, filePath) {
		if(!filePath){
			console.log("Child url is required.");
			return;
		}
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.addArchive(pin, url, filePath);
		});
	},
	addArchive: function (pin, url, filePath) {
		filePath = path.resolve(filePath);
		if(!fs.existsSync(filePath)){
			console.log(filePath, "is invalid.");
			return;
		}
		var args = utils.traverseUrl(pin, url);
		if(args.length !== 3){
			console.log("Invalid url");
			return;
		}
		var csb = utils.getChildCsb(args[0], args[1]);
		var alias = args[2];
		var self = this;
		console.log(args[1]);

		if(!csb.Data["records"]["Adiacent"]){
			csb.Data["records"]["Adiacent"] = [];
			if(!fs.existsSync(utils.Paths.Adiacent)){
				fs.mkdirSync(utils.Paths.Adiacent);
			}
		}
		var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", alias);
		// var indexAdiacent = csb.Data["records"]["Adiacent"].indexOf(crypto.generateSafeUid(csb.Dseed, path.basename(filePath)));
		console.log("----------------------------------indexAdiacent", indexAdiacent);
		if(indexAdiacent >= 0){
			console.log("A file with the name", path.basename(filePath), "already exists in the current csb");
			var prompt = "Do you want to overwrite it ?";
			utils.confirmOperation(prompt, null, function (err, rl) {
				self.saveChildInCsb(filePath, csb, alias, indexAdiacent);
			})
		}else{
			self.saveChildInCsb(filePath, csb, alias, indexAdiacent);
		}



	},
	saveChildInCsb: function (filePath, csb, alias, indexAdiacent) {
		var seed = crypto.generateSeed(utils.defaultBackup);
		var dseed = crypto.deriveSeed(seed);
		var pth = crypto.generateSafeUid(dseed, path.basename(filePath));
		var fileRecord = {
			"Title": alias,
			"Path" : pth,
			"Seed" : seed.toString("hex"),
			"Dseed": crypto.deriveSeed(seed).toString("hex")
		};
		crypto.encryptStream(filePath,path.join(utils.Paths.Adiacent, pth), dseed);
		if(indexAdiacent >= 0){
			csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		}
		csb.Data["records"]["Adiacent"].push(fileRecord);
		console.log("This is the csb");
		console.log(csb.Data["records"]["Adiacent"]);
		utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});
