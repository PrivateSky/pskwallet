var path = require("path");
require(path.resolve(__dirname + "../../../../../engine/core"));
var fs = require("fs");
const VirtualMQ        = $$.requireModule('virtualmq');
const tempFolder = path.resolve('./tmp');

var startServer = function (port, folderPath ) {
	var virtualMq = VirtualMQ.createVirtualMQ(port, folderPath);

};
startServer(8080,  path.join(tempFolder, "CSB"));



