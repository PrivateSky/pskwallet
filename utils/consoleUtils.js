const readline = require("readline");
const getPassword = require("./getPassword").readPassword;

exports.insertPassword = function(prompt, noTries, callback){
	prompt = prompt || "Insert pin:";
	if(noTries == 0){
		console.log("You have inserted an invalid character 3 times");
		console.log("Preparing to exit");

	}else {
		getPassword(prompt, function (err, pin) {
			if(err) {
				console.log("You have inserted an invalid character");
				console.log("Try again");
				exports.insertPassword(prompt, noTries-1, callback);
			}else{
				callback(null, pin);
			}
		});
	}
};

exports.enterRecord = function(fields, currentField, record, rl, callback){
	record = record || {};
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if(currentField == fields.length){
		rl.close();
		callback(null, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
			exports.enterRecord(fields, currentField + 1, record, rl, callback);
		});
	}
};

exports.enterField = function(field, rl, callback){
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question("Insert " + field + ":", (answer) => {
		rl.close();
		callback(null, answer);
	});
};


exports.confirmOperation = function (prompt, rl, callback) {
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	prompt = prompt || "Do you want to continue?";
	rl.question(prompt + "[y/n]", (answer) => {
		if (answer === "y") {
			callback(null, rl);
		} else if (answer !== "n") {
			console.log("Invalid option");
			exports.confirmOperation(prompt, rl, callback);
		}else{
			rl.close();
		}
	});

};