const crypto = require('pskcrypto');

function Seed(keyLen = 32) {

	this.create = function (backupUrls) {
		if(!backupUrls){
			throw new  Error('No backups provided.');
		}
		const seed = {};

		if (!Array.isArray(backupUrls)) {
			backupUrls = [backupUrls];
		}
		seed.tag    = 's';
		seed.random = crypto.randomBytes(keyLen);
		seed.backup = backupUrls;

		return seed;
	};

	this.deriveSeed = function (seed) {
		let compactSeed = seed;

		if(typeof seed === 'object' && !Buffer.isBuffer(seed)){
			compactSeed = this.generateCompactForm(seed);
		}

		if(Buffer.isBuffer(seed)) {
			compactSeed = seed.toString();
		}

		if(compactSeed[0] === 'd') {
			throw new Error('Tried to derive an already derived seed.');
		}

		const decodedCompactSeed = decodeURIComponent(compactSeed);
		const splitCompactSeed = decodedCompactSeed.substring(1).split('|');

		const strSeed = Buffer.from(splitCompactSeed[0], 'base64').toString();
		const backupUrls = Buffer.from(splitCompactSeed[1], 'base64').toString();
		const dseed = {};

		dseed.tag 		 = 'd';
		dseed.random 	 = crypto.deriveKey(strSeed, null, keyLen);
		dseed.backup     = JSON.parse(backupUrls);

		return dseed;
	};

	this.generateCompactForm = function ({tag, random, backup}) {
		const compactSeed = tag + random.toString('base64') + '|' + Buffer.from(JSON.stringify(backup)).toString('base64');
		return Buffer.from(encodeURIComponent(Buffer.from(compactSeed)));
	};

	this.load = function (compactSeed) {
		if(Buffer.isBuffer(compactSeed)) {
			compactSeed = compactSeed.toString();
		}

		const decodedCompactSeed = decodeURIComponent(compactSeed);
		const seed = {};
		const splitCompactSeed = decodedCompactSeed.substring(1).split('|');

		seed.tag = decodedCompactSeed[0];
		seed.random = Buffer.from(splitCompactSeed[0], 'base64');
		seed.backup = JSON.parse(Buffer.from(splitCompactSeed[1], 'base64').toString());

		return seed;
	};

	this.getBackupUrls = function (seed) {
		if(typeof seed === 'string' || Buffer.isBuffer(seed)){
			seed = this.load(seed);
		}

		return seed.backup;
	};

	this.isValidForm = function (seed) {
		try {
			if (typeof seed === 'string' || Buffer.isBuffer(seed)) {
				seed = this.load(seed);
			}

			if (seed.tag !== 's' && seed.tag !== 'd') {
				return false;
			}

			if (!Buffer.isBuffer(seed.random)) {
				return false;
			}

			return seed.backup.length !== 0;

		} catch (e) {
			return false;
		}
	};

}

module.exports = new Seed();