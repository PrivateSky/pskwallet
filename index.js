module.exports.utils  = require("./utils/flowsUtils");
const RootCSB = require('./libraries/RootCSB');
module.exports.createRootCSB = RootCSB.createRootCSB;
module.exports.loadWithDseed = RootCSB.loadWithDseed;
module.exports.loadWithSeed  = RootCSB.loadWithSeed;
module.exports.loadWithPin   = RootCSB.loadWithPin;
module.exports.writeNewMasterCSB = RootCSB.writeNewMasterCSB;
module.exports.RootCSB = RootCSB;
module.exports.RawCSB = require('./libraries/RawCSB');
module.exports.Seed = require('./utils/Seed');
module.exports.CSBServer = require('./libraries/CSBServer');
module.exports.init = function () {
	$$.loadLibrary("pskwallet", require("./libraries/flows/index"));
};

