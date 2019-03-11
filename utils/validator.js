const RootCSB = require("../libraries/RootCSB");


module.exports.validatePin = function (localFolder, swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(localFolder, null, null, null, pin, (err, rootCSB, dseed, backups) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries-1);
		}else{
			if(!dseed){
				console.log("undefined Dseed");
				args.push(backups);
			}else {
				console.log("rootCSB");
				swarm.rootCSB = rootCSB;
				swarm.dseed = dseed;
				args.push(backups);
			}
			swarm[phaseName](pin, ...args);
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