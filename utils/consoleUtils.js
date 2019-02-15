const readline = require("readline");
const getPassword = require("./getPassword").readPassword;

function insertPassword(prompt, noTries, callback){
	prompt = prompt || "Insert pin:";
	if(noTries === 0){
		console.log("You have inserted an invalid pin 3 times");
		console.log("Preparing to exit");

	}else {
		getPassword(prompt, function (err, pin) {
			if(err) {
				console.log("You have inserted an invalid character");
				console.log("Try again");
				insertPassword(prompt, noTries-1, callback);
			}else{
				callback(null, pin);
			}
		});
	}
}



module.exports = {
	insertPassword,
};