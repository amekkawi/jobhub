var JobForkObserver = require('../../lib/JobForkObserver');

describe('JobForkObserver', function() {
	it('should set properties from constructor', function() {
		var trackedJob = {};
		var noop = function() {};
		var observer = new JobForkObserver(trackedJob, noop, noop, noop);
		expect(observer.trackedJob).toBe(trackedJob);
	});
});
