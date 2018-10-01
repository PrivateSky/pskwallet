var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = require("pskcrypto");
$$.flow.describe("extract", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.checkType(pin, url, function (err) {

			});
		});
	},
	checkType: function (pin, url, callback) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				return callback(err);
			}
			if(args.length > 3 || args.length < 2){
				$$.interact.say("Invalid url");
				return;
			}

			var parentCsb = args[0];
			var aliasCsb = args[1];
			if(!parentCsb || !parentCsb.Data || (!parentCsb.Data["records"]["Csb"] && !parentCsb.Data["records"]["Adiacent"])){
				$$.interact.say("Invalid url");
				return;
			}
			if(parentCsb.Data["records"]["Csb"].length === 0 && parentCsb.Data["records"]["Adiacent"].length === 0) {
				$$.interact.say("Nothing to extract");
				return;
			}

			utils.getChildCsb(parentCsb, aliasCsb, function (err, csb) {
				if(err){
					return callback(err);
				}
				if(!csb){
					$$.interact.say("invalid url");
					return;
				}
				if(args.length === 3) {
					var aliasFile = args[2];
					var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", aliasFile);
					if (indexAdiacent >= 0) {
						self.extractArchive(csb, aliasFile, indexAdiacent, function (err) {

						});
					} else {
						$$.interact.say("Invalid url.");
					}
				}else {
					self.extractCsb(csb, function (err) {

					});
				}
			});
		});
	},
	extractCsb: function (csb, callback) {
		$$.interact.say("Extract csb");
		// var childCsb = utils.readCsb(csb.Data["records"]["Csb"][indexCsb]["Path"], csb.Data["records"]["Csb"][indexCsb]["Dseed"]);
		fs.writeFile(path.join(process.cwd(), csb.Title), JSON.stringify(csb.Data, null, "\t"), function (err) {
			if(err){
				return callback(err);
			}
			$$.interact.say("Csb", csb.Title, "was extracted");
		});
		// fs.unlinkSync(csb.Data["records"]["Csb"][indexCsb]["Path"]);
		// csb.Data["records"]["Csb"].splice(indexCsb, 1);
		// utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	},
	extractArchive: function (csb, aliasFile, indexAdiacent, callback) {
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]["Path"]), 
			process.cwd(), Buffer.from(csb.Data["records"]["Adiacent"][indexAdiacent]["Dseed"], "hex"), function (err) {
				if(err){
					return callback(err);
				}
				$$.interact.say("File", aliasFile, "was extracted");
			});
		// csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		// utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});