var expect = require('expect');

exports.initWorker = expect.createSpy()
	.andCall(function() {
		return Promise.reject(exports.initWorker.expectedError = new Error());
	});
