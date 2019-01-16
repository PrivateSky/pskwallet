const RootCSB = require("../libraries/RootCSB");


module.exports.validatePin = function (localFolder, swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(localFolder, null, null, null, pin, (err, rootCSB) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries-1);
		}else{
			swarm.rootCSB = rootCSB;
			swarm[phaseName](...args);
		}
	});
};

module.exports.reportOrContinue = function(swarm, phaseName, errorMessage, ...args){
	return function(err,...res) {
		if (err) {
			swarm.swarm("interaction", "handleError", err, errorMessage);
		} else {
			if (phaseName) {
					swarm[phaseName](...res, ...args);
			}
		}
	}
};