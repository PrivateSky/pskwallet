const crypto = require('pskcrypto');

function Seed() {

	this.create = function (backupUrls) {
		const seed = {};

		if (!Array.isArray(backupUrls)) {
			backupUrls = [backupUrls];
		}
		seed.random = crypto.randomBytes(32);
		seed.backup = backupUrls;

		return seed;
	};

	this.deriveSeed = function (seed) {
		let compactSeed = seed;
		if(typeof seed === 'object'){
			compactSeed = this.generateCompactForm(seed);
		}

		if(compactSeed[0] === 'd') {
			throw new Error('Tried to derive an already derived seed.');
		}

		const strSeed = seed.toString();
		const backupUrls = strSeed.substring(33);
		const dseed = {};
		dseed.tag 		 = 'd';
		dseed.random 	 = crypto.deriveKey(compactSeed, null, 32).toString('hex');
		dseed.backupUrls = JSON.stringify(backupUrls);

		return Buffer.from(dseed);
	};

	this.generateCompactForm = function ({tag, random, backup}) {
		const compactSeed = tag + random.toString('hex') + JSON.stringify(backup);
		return Buffer.from(compactSeed);
	};

	this.load = function (compactSeed) {
		const seed = {};
		const compactSeedStr = compactSeed.toString();
		seed.tag = compactSeedStr[0];
		seed.random = Buffer.from(compactSeedStr.substring(1, 65), 'hex');
		seed.backup = JSON.parse(compactSeedStr.substring(65));

		return seed;
	};

	this.getBackupUrls = function (seed) {
		if(typeof seed === 'string'){
			seed = this.load(seed);
		}
		return seed.backup;
	}
}

module.exports = Seed;