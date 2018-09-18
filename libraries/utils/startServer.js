var path = require("path");
var fs = require("fs");
const VirtualMQ        = require('virtualmq');
const tempFolder = path.resolve('./tmp');

var startServer = function (port, folderPath ) {
	var virtualMq = VirtualMQ.createVirtualMQ(port, folderPath);

};
startServer(8080,  path.join(tempFolder, "CSB"));



