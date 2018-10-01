var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = require("pskcrypto");
$$.flow.describe("addFile", {
	start: function (url, filePath) {
		if(!filePath){
			$$.interact.say("Child url is required.");
			return;
		}
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.addArchive(pin, url, filePath, function (err) {
				if(err){
					throw err;
				}else{
					console.log("Completed");
				}
			});
		});
	},
	addArchive: function (pin, url, filePath, callback) {
		filePath = path.resolve(filePath);
		var self = this;
		// if(!fs.existsSync(filePath)){
		// 	$$.interact.say(filePath, "is invalid.");
		// 	return;
		// }
		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				callback(err);
				return;
			}
			if(args.length !== 3){
				$$.interact.say("Invalid url");
				return;
			}
			utils.getChildCsb(args[0], args[1], function (err, csb) {
				if(err){
					callback(err);
					return;
				}
				var alias = args[2];

				$$.interact.say(args[1]);

				if(!csb.Data["records"]["Adiacent"]){
					csb.Data["records"]["Adiacent"] = [];
					$$.ensureFolderExists(utils.Paths.Adiacent, function (err) {
						if(err){
							callback(err);
							return;
						}
						var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", alias);
						if(indexAdiacent >= 0){
							$$.interact.say("A file with the name", path.basename(filePath), "already exists in the current csb");
							var prompt = "Do you want to overwrite it ?";
							utils.confirmOperation(prompt, null, function (err, rl) {
								self.saveChildInCsb(filePath, csb, alias, indexAdiacent, function (err) {
									if(err){
										callback(err);
									}
								});
							})
						}else{
							self.saveChildInCsb(filePath, csb, alias, indexAdiacent, function (err) {
								if(err){
									callback(err);
								}
							});
						}

					})
				}

			});
		});
	},
	saveChildInCsb: function (filePath, csb, alias, indexAdiacent, callback) {
		var seed = crypto.generateSeed(utils.defaultBackup);
		var dseed = crypto.deriveSeed(seed);
		var pth = crypto.generateSafeUid(dseed, path.basename(filePath));
		var fileRecord = {
			"Title": alias,
			"Path" : pth,
			"Seed" : seed.toString("hex"),
			"Dseed": crypto.deriveSeed(seed).toString("hex")
		};
		crypto.encryptStream(filePath,path.join(utils.Paths.Adiacent, pth), dseed, function (err) {
			if(err){
				return callback(err);
			}
			if(indexAdiacent >= 0){
				csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
			}
			csb.Data["records"]["Adiacent"].push(fileRecord);
			$$.interact.say("This is the csb");
			$$.interact.say(csb.Data["records"]["Adiacent"]);
			utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
				if(err){
					callback(err);
					return;
				}
				$$.interact.say(filePath, "was added in", csb.Title);
			});
		});

	}
});
