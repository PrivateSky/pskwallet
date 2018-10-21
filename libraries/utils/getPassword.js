
exports.readPassword = function (prompt, callback) {
	var stdin = process.stdin;
	var stdout = process.stdout;

	if (prompt) {
		stdout.write(prompt);
	}

	stdin.resume();
	stdin.setRawMode(true);
	stdin.resume();
	stdin.setEncoding('utf8');

	var password = "";

	function escaping(...args) {
		stdin.removeListener("data", readingInput);
		stdin.pause();
		callback(...args);
	}

	function readingInput(data) {
		if (/[\x00-\x03]|[\x05-\x07]|[\x09]|[\x0B-\x0C]|[\x0E-\x1F]/.test(data)) {
			escaping(new Error("Invalid character " + data));
			return;
		}
		switch (data) {
			case "\x0A":
			case "\x0D":
			case "\x04":
				stdout.write('\n');
				stdin.setRawMode(false);
				stdin.pause();
				escaping(false, password);
				break;
			case "\x08":
				password = password.slice(0, password.length - 1);
				stdout.clearLine();
				stdout.cursorTo(0);
				stdout.write(prompt);
				for (var i = 0; i < password.length; i++) {
					stdout.write("*");
				}
				break;
			default:
				let str = "";
				for (var i = 0; i < data.length; i++) {
					str += "*";
				}
				stdout.write(str);
				password += data;
		}
	}

	stdin.on('data', readingInput);
};