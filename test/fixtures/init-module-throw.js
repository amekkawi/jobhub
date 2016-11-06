var expect = require('expect');

exports.initWorker = expect.createSpy()
	.andCall(function() {
		throw exports.initWorker.expectedError = new Error();
	});
