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

function enterRecord(fields, currentField, record, rl, callback){
	record = record || {};
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if(currentField === fields.length){
		rl.close();
		callback(null, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
			enterRecord(fields, currentField + 1, record, rl, callback);
		});
	}
}

function enterField(field, rl, callback){
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question("Insert " + field + ":", (answer) => {
		rl.close();
		callback(null, answer);
	});
}


function confirmOperation(prompt, rl, callback) {
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	prompt = prompt || "Do you want to continue?";
	rl.question(prompt + "[y/n]", (answer) => {
		if (answer === "y") {
			rl.close();
			callback(null);
		} else if (answer !== "n") {
			console.log("Invalid option");
			confirmOperation(prompt, rl, callback);
		}else{
			rl.close();
		}
	});

}

module.exports = {
	insertPassword,
	enterRecord,
	enterField,
	confirmOperation
};