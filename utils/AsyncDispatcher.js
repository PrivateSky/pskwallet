
function AsyncDispatcher(finalCallback) {
	const results = [];
	const errors = [];

	let started = 0;

	function dispatch(fn) {
		++started;
		fn(function (err, res) {
			if(err) {
				errors.push(err);
			}

			if(arguments.length > 2) {
				arguments[0] = undefined;
				res = arguments;
			}

			if(typeof res !== "undefined") {
				results.push(res);
			}


			if(--started <= 0) {
				finalCallback(errors, results);
			}
		});
	}

	function markOneAsFinished(err, res) {
		if(err) {
			errors.push(err);
		}

		if(arguments.length > 2) {
			arguments[0] = undefined;
			res = arguments;
		}

		if(typeof res !== "undefined") {
			results.push(res);
		}

		if(--started <= 0) {
			finalCallback(errors, results);
		}
	}

	function emptyDispatch(amount = 1) {
		started += amount;
	}

	return {
		dispatch,
		emptyDispatch,
		markOneAsFinished
	}
}

module.exports = AsyncDispatcher;