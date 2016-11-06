var path = require('path');
var expect = require('expect');
var util = require('../../lib/util');

exports.initWorker = expect.createSpy()
	.andCall(function(jobWorker) {
		// Expect options to be parsed at this point
		var defaultOptions = util.getDefaultManagerOptions();
		Object.keys(defaultOptions).forEach(function(key) {
			if (key === 'jobsModulePath') {
				expect(jobWorker.options[key]).toBe(path.join(__dirname, 'jobs.js'));
			}
			else if (key === 'initModulePath') {
				expect(jobWorker.options[key]).toBe(__filename);
			}
			else {
				expect(jobWorker.options[key]).toBe(defaultOptions[key], 'Expected JobWorker#options.' + key + ' %s to be %s');
			}
		});
	});
