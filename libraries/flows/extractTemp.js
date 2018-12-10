var path = require("path");

const utils = require("./../../utils/flowsUtils");
const fs = require("fs");
const crypto = require("pskcrypto");
$$.swarm.describe("extractTemp", {
	start: function (url) {
		this.url = url;
		this.swarm("interaction", "readPin", utils.noTries);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if (err) {
				self.swarm("interaction", "readPin", noTries - 1);
			} else {
				self.extract(pin);
			}
		})
	},
	extract: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(err){
				self.swarm("interaction", "handleError", err);
				return;
			}
			if(args.length !== 4){
				self.swarm("interaction", "handleError", null, "Invalid url", true);
				return;
			}

			const parentCsb = args[0];
			const aliasCsb = args[1];
			utils.getChildCsb(parentCsb, aliasCsb, function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to load child csb");
					return;
				}
				if(!csb){
					self.swarm("interaction", "handleError", null, "Csb" + aliasCsb +"could not be found", true);
					return;
				}

				const memoryBlockchain = require('pskdb').startInMemoryDB();
				const transaction = memoryBlockchain.beginTransaction({});
				const pskdbHandler = transaction.getHandler();
				const alias = args[3];

				pskdbHandler.initialiseInternalValue(csb.Data["pskdb"]);

				const file = transaction.lookup('global.FileReference', alias);

				crypto.decryptStream(file.path, process.cwd(), Buffer.from(csb.Dseed, "hex"), function (err) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to decrypt " + "");
						return;
					}
					fs.writeFile(path.join(process.cwd(), csb.Title), JSON.stringify(csb.Data, null, "\t"), function (err) {
						if(err){
							self.swarm("interaction", "handleError", err, "Failed to write csb " + csb.Title);
							return;
						}
						self.swarm("interaction", "printInfo", "The asset having the alias " + alias + " was successfully extracted");
					});
				});
			});
		});
	}
});