module.exports.utils  = require("./utils/flowsUtils");
module.exports.createRootCSB = require('./libraries/RootCSB').createRootCSB;
module.exports.RawCSB = require('./libraries/RawCSB');
module.exports.Seed = require('./utils/Seed');
module.exports.init = function(){
    $$.loadLibrary("pskwallet",require("./libraries/flows/index"));
}

