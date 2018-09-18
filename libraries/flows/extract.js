var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const fs = require("fs");
const crypto = require("pskcrypto");
$$.flow.describe("extract", {
	start: function (url) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.checkType(pin, url);
		});
	},
	checkType: function (pin, url) {
		var args = utils.traverseUrl(pin, url);
		if(args.length > 3 || args.length < 2){
			console.log("Invalid url");
			return;
		}

		var parentCsb = args[0];
		var aliasCsb = args[1];
		if(!parentCsb || !parentCsb.Data || (!parentCsb.Data["records"]["Csb"] && !parentCsb.Data["records"]["Adiacent"])){
			console.log("Invalid url");
			return;
		}
		if(parentCsb.Data["records"]["Csb"].length === 0 && parentCsb.Data["records"]["Adiacent"].length === 0) {
			console.log("Nothing to extract");
			return;
		}

		var csb = utils.getChildCsb(parentCsb, aliasCsb);
		if(!csb){
			console.log("invalid url");
			return;
		}
		if(args.length === 3) {
			var aliasFile = args[2];
			var indexAdiacent = utils.indexOfRecord(csb.Data, "Adiacent", aliasFile);
			if (indexAdiacent >= 0) {
				this.extractArchive(csb, aliasFile, indexAdiacent);
			} else {
				console.log("Invalid url.");
				return;
			}
		}else {
			this.extractCsb(csb);
		}
	},
	extractCsb: function (csb) {
		console.log("Extract csb");
		// var childCsb = utils.readCsb(csb.Data["records"]["Csb"][indexCsb]["Path"], csb.Data["records"]["Csb"][indexCsb]["Dseed"]);
		fs.writeFileSync(path.join(process.cwd(), csb.Title), JSON.stringify(csb.Data, null, "\t"));
		// fs.unlinkSync(csb.Data["records"]["Csb"][indexCsb]["Path"]);
		// csb.Data["records"]["Csb"].splice(indexCsb, 1);
		// utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	},
	extractArchive: function (csb, aliasFile, indexAdiacent) {
		crypto.decryptStream(path.join(utils.Paths.Adiacent, csb.Data["records"]["Adiacent"][indexAdiacent]["Path"]), process.cwd(), Buffer.from(csb.Data["records"]["Adiacent"][indexAdiacent]["Dseed"], "hex"));
		// csb.Data["records"]["Adiacent"].splice(indexAdiacent, 1);
		// utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed);
	}
});