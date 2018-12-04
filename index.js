module.exports.utils  = require("./utils/flowsUtils");
module.exports.init = function(){
    $$.loadLibrary("pskwallet",require("./libraries/flows/index"));
}

