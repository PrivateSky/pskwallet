const path = require("path");


exports.defaultBackup = "http://localhost:8080";
exports.defaultPin = "12345678";
exports.noTries = 3;

exports.Paths = {
	"auxFolder"          : path.join(process.cwd(), ".privateSky"),
	"Dseed"             : path.join(process.cwd(), ".privateSky", "Dseed")
};

