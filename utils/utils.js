const path = require('path');
const crypto = require("pskcrypto");

function generatePath(localFolder, dseed) {
	if(dseed && !Buffer.isBuffer(dseed)){
		dseed = Buffer.from(dseed, "hex");
	}
	return path.join(localFolder, crypto.generateSafeUid(dseed, localFolder));
}

module.exports = {
	generatePath
};