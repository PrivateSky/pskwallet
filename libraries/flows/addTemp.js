const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
var fs = require("fs");
const path = require("path");
$$.swarm.describe("addTemp", {
	start: function (url, filePath) {
		this.url = url;
		this.filePath = filePath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if (err) {
				self.swarm("interaction", "readPin", noTries - 1);
			} else {
				self.addFile(pin);
			}
		})
	},

	addFile: function (pin) {
		this.filePath = path.resolve(this.filePath);
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
				var alias = args[3];
				$$.ensureFolderExists(utils.Paths.PskdbFiles, function (err) {
					if (err) {
						self.swarm("interaction", "handleError", err, "Failed to create Adiacent folder");
						return;
					}
					const memoryBlockchain = require('pskdb').startInMemoryDB();
					const transaction = memoryBlockchain.beginTransaction({});
					const pskdbHandler = transaction.getHandler();

					pskdbHandler.initialiseInternalValue(csb.Data["pskdb"]);


					const file = transaction.lookup('global.FileReference', alias);
					if (file.isPersisted()) {
						self.swarm("interaction", "handleError", err, "A file with the same alias " + alias + " already exists ");
						return;
					}


					var fileId = crypto.generateSafeUid(null, path.basename(self.filePath));
					var pth = path.join(utils.Paths.PskdbFiles, fileId);
					crypto.encryptStream(self.filePath, pth, Buffer.from(csb.Dseed, "hex"), function (err) {
						if (err) {
							self.swarm("interaction", "handleError", err, "Failed to encrypt stream");
							return;
						}

						file.init(alias, pth);
						transaction.add(file);
						memoryBlockchain.commit(transaction);
						csb.Data["pskdb"] = pskdbHandler.getInternalValues();

						utils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
							if (err) {
								self.swarm("interaction", "handleError", err, "Failed to write csb to file");
								return;
							}
							self.swarm("interaction", "printInfo", self.filePath + " has been successfully added to " + csb.Title);
						});
					});
				});
			});
		});
	}
});