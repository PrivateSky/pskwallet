const flowsUtils = require("./../../utils/flowsUtils");
// const urils = require("./../../utils/utils");
const crypto = require("pskcrypto");
// var fs = require("fs");
const path = require("path");
const validator = require("../../utils/validator");
$$.swarm.describe("embedFile", {
	start: function (url, filePath) { //csb1:assetType:alias
		const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
		console.log("CSBPath:", CSBPath, alias);
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.filePath = filePath;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(process.cwd(), this, 'loadFileReference', pin, noTries);
	},

	addFile: function (pin) {
		this.filePath = path.resolve(this.filePath);
		var self = this;
		flowsUtils.traverseUrl(pin, this.url, function (err, args) {
			if (err) {
				self.swarm("interaction", "handleError", err, "Failed to traverse url");
				return;
			}

			flowsUtils.getChildCsb(args[0], args[1], function (err, csb) {
				if (err) {
					self.swarm("interaction", "handleError", err, "Failed to get child csb");
					return;
				}
				var alias = args[3];
				$$.ensureFolderExists(flowsUtils.Paths.PskdbFiles, function (err) {
					if (err) {
						self.swarm("interaction", "handleError", err, "Failed to create Adiacent folder");
						return;
					}
					const memoryBlockchain = require('pskdb').startInMemoryDB();
					const transaction = memoryBlockchain.beginTransaction({});
					const pskdbHandler = transaction.getHandler();

					pskdbHandler.initialiseInternalValue(csb.Data["pskdb"]);


					const file = transaction.lookup('global.FileReference', alias);

					if (!file.isEmpty()) {
						self.swarm("interaction", "handleError", err, "A file with the same alias " + alias + " already exists ");
						return;
					}


					var fileId = crypto.generateSafeUid(null, path.basename(self.filePath));
					var pth = path.join(flowsUtils.Paths.PskdbFiles, fileId);
					crypto.encryptStream(self.filePath, pth, Buffer.from(csb.Dseed, "hex"), function (err) {
						if (err) {
							self.swarm("interaction", "handleError", err, "Failed to encrypt stream");
							return;
						}

						file.init(alias, pth);
						transaction.add(file);
						memoryBlockchain.commit(transaction);
						csb.Data["pskdb"] = pskdbHandler.getInternalValues();

						flowsUtils.writeCsbToFile(csb.Path, csb.Data, csb.Dseed, function (err) {
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
