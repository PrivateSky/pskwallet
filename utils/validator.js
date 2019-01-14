const RootCSB = require("../libraries/RootCSB");


module.exports.validatePin = function (swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(process.cwd(), null, null, null, pin, (err, rootCSB) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries-1);
		}else{
			swarm.rootCSB = rootCSB;
			swarm[phaseName](...args)
		}
	});
};

module.exports.reportOrContinue = function(swarm, phaseName, errorMessage, ...args){
	return function(err,res) {
		if (err) {
			swarm.swarm("interaction", "handleError", err, errorMessage);
		} else {
			if (phaseName) {
				if(res) {
					swarm[phaseName](res, ...args);
				}else{
					swarm[phaseName](...args);
				}
			}
		}
	}
};