const path = require('path');
const fs = require('fs');
const VirtualMQ = require('virtualmq');
const httpWrapper = VirtualMQ.getHttpWrapper();
const httpUtils = httpWrapper.httpUtils;
const Server = httpWrapper.Server;
const crypto = require('pskcrypto');
const BusBoy = require('busboy');

function CSBServer(listeningPort, rootFolder, callback) {
	const port = listeningPort || 8081;
	const server = new Server().listen(port);
	const randSize = 32;
	rootFolder = path.join(rootFolder, 'CSB_TMP');

	console.log("Listening on port:", port);

	$$.ensureFolderExists(rootFolder, (err) => {
		if(err) {
			throw err;
		}

		registerEndpoints();
		if(typeof callback === 'function') {
			callback();
		}
	});

	function registerEndpoints() {
		server.use((req, res, next) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Origin');
			res.setHeader('Access-Control-Allow-Credentials', true);
			next();
		});

		server.post('/init', (req, res) => {
			const transactionId = crypto.randomBytes(randSize).toString('hex');
			$$.ensureFolderExists(path.join(rootFolder, transactionId), (err) => {
				if(err) {
					res.statusCode = 500;
					res.end();
					return;
				}

				res.end(transactionId);
			});
		});

		server.post('/upload', (req, res) => {
			res.statusCode = 400;
			res.end('Illegal url, missing transaction id');
		});

		server.post('/upload/:transactionId', (req, res) => {
			const transactionId = req.params.transactionId;
			fs.stat(path.join(rootFolder, transactionId), (err) => {
				if(err) {
					res.statusCode = 400;
					res.end('Transaction with specified id does not exist, call /init first');
					return;
				}

				const busBoy = new BusBoy({headers: req.headers});
				busBoy.on('file', (fieldName, file, filename, encoding, mimeType) => {
					const saveTo = path.join(rootFolder, transactionId, filename);
					file.pipe(fs.createWriteStream(saveTo));
				});

				busBoy.on('field', function(fieldName, val, fieldnameTruncated, valTruncated, encoding, mimeType) {
					const saveTo = path.join(rootFolder, transactionId, fieldName) + '.txt';
					const file = fs.createWriteStream(saveTo);
					file.write(val);
				});

				busBoy.on('finish', function() {
					res.writeHead(201, { 'Connection': 'close' });
					res.end();
				});

				req.pipe(busBoy);
			})
		});

		server.use((req, res) => {
			res.statusCode = 404;
			res.end();
		});
	}
}

module.exports = CSBServer;
