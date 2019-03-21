const RootCSB = require("../libraries/RootCSB");
const fs = require("fs");
const path = require("path");


module.exports.validatePin = function (localFolder, swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(localFolder, null, null, null, pin, (err, rootCSB, dseed, backups) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries-1);
		}else{
			if(!dseed){
				args.push(backups);
			}else {
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

module.exports.checkMasterCSBExists = function (localFolder, callback) {
	fs.stat(path.join(localFolder, ".privateSky/dseed"), (err, stats)=>{
		if(err){
			return callback(err, false);
		}

		return callback(undefined, true);
	})
};