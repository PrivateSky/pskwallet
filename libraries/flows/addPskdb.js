const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
var fs = require("fs");

$$.swarm.describe("addPskdb", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.addPskdb(pin);
			}
		})
	},

	addPskdb: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if (err) {
				self.swarm("interaction", "handleError", err, "Failed to traverse url");
				return;
			}

			utils.getChildCsb(args[0], args[1], function (err, csb) {
				if (err) {
					self.swarm("interaction", "handleError", err, "Failed to get child csb");
					return;
				}
				const memoryBlockchain = require('pskdb').startInMemoryDB();
				const transaction = memoryBlockchain.beginTransaction({});
				const pskdbHandler = transaction.getHandler();
				csb.Data["pskdb"] = pskdbHandler.getInternalValues();
				utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to write csb " + csb.Title + " to file.");
						return;
					}
					self.swarm("interaction", "printInfo", "Pskdb successfully added to csb " + csb.Title);
				});
			});

		});
	}

});