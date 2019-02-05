const path = require('path');
const crypto = require("pskcrypto");

function generatePath(localFolder, dseed) {
	if(dseed && !Buffer.isBuffer(dseed)){
		dseed = Buffer.from(dseed, "hex");
	}
	return path.join(localFolder, crypto.generateSafeUid(dseed));
}

function processUrl(url,assetType) {
	let splitUrl = url.split('/');
	const aliasAsset = splitUrl.pop();
	let CSBPath = splitUrl.join('/');
	return {
		CSBPath: CSBPath + ':' + assetType + ':' + aliasAsset,
		alias: aliasAsset
	};
}

module.exports = {
	generatePath,
	processUrl
};