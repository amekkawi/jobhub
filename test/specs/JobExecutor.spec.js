var expect = require('expect');
var JobExecutor = require('../../lib/JobExecutor');

describe('JobExecutor', function() {
	it('should set properties from constructor', function() {
		var options = {};
		var manager = {};
		var executor = new JobExecutor(options, manager);
		expect(executor.options).toBe(options, 'Expected JobExecutor#options %s to be %s');
		expect(executor.manager).toBe(manager, 'Expected JobExecutor#manager %s to be %s');
	});

	it('should throw error if not implemented abstract methods', function() {
		var executor = new JobExecutor({}, {});

		return Promise.all([
			new Promise(function() {
				executor.add({});
				throw new Error('Expected to throw error for JobExecutor#add');
			}).catch(function(err) {
				if (!(err instanceof Error) || err.message !== 'JobExecutor#add is abstract and must be overridden') {
					throw err;
				}
			}),
			new Promise(function() {
				executor.getStatus({});
				throw new Error('Expected to throw error for JobExecutor#getStatus');
			}).catch(function(err) {
				if (!(err instanceof Error) || err.message !== 'JobExecutor#getStatus is abstract and must be overridden') {
					throw err;
				}
			})
		]);
	});


});
