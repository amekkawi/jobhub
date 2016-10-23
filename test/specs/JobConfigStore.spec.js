var EventEmitter = require('events').EventEmitter;
var expect = require('expect');
var errors = require('../../lib/errors');
var JobConfigStore = require('../../lib/JobConfigStore');

describe('JobConfigStore', function() {
	it('should extend from EventEmitter', function() {
		var store = new JobConfigStore();
		expect(store instanceof EventEmitter).toBe(true, 'Expected JobConfigStore to be instance of EventEmitter');
	});

	it('should allow jobs to be registered and emit JOB_REGISTERED', function() {
		var expectedConfig = {
			run: function() {}
		};

		var store = new JobConfigStore();

		var spyRegisteredEvent = expect.createSpy().andCall(function() {
			expect(arguments.length).toBe(2, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe('foo', 'Expected arguments[0] %s to be %s');
			expect(arguments[1]).toNotBe(expectedConfig, 'Expected arguments[1] %s to be not be original config');
			expect(arguments[1]).toBeA(Object, 'Expected arguments[1] %s to be a %s');
			expect(arguments[1].jobName).toBe('foo', 'Expected arguments[1].jobName %s to be %s');
			expect(arguments[1].run).toBe(expectedConfig.run, 'Expected arguments[1].run %s to be original function');
		});
		store.on('JOB_REGISTERED', spyRegisteredEvent);

		expect(store.registerJob('foo', expectedConfig)).toBe(store, 'Expected return of JobConfigStore#registerJob %s to be itself (i.e. this)');

		expect(spyRegisteredEvent.calls.length).toBe(1, 'Expected JOB_REGISTERED emit count %s to be %s');
	});

	it('should allow retrieval of a job by name', function() {
		var expectedConfigA = {
			run: function() {}
		};

		var expectedConfigB = {
			run: function() {}
		};

		var store = new JobConfigStore();

		store.registerJob('foo', expectedConfigA);
		store.registerJob('bar', expectedConfigB);

		var jobConfigA = store.getJobConfig('foo');
		expect(jobConfigA).toBeA(Object);
		expect(jobConfigA.jobName).toBe('foo');
		expect(jobConfigA.run).toBe(expectedConfigA.run);

		var jobConfigB = store.getJobConfig('bar');
		expect(jobConfigB).toBeA(Object);
		expect(jobConfigB.jobName).toBe('bar');
		expect(jobConfigB.run).toBe(expectedConfigB.run);
	});

	it('should throw InvalidJobConfigError for invalid config', function() {
		var store = new JobConfigStore();
		var thrownError;
		try {
			store.registerJob('foo', {});
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.InvalidJobConfigError, 'Expected %s to  be a InvalidJobConfigError');
		expect(thrownError.jobName).toBe('foo', 'Expected InvalidJobConfigError#jobName %s to be %s');
	});

	it('should throw an error if a job name is already registered', function() {
		var store = new JobConfigStore();
		store.registerJob('foo', { run: function() {} });
		store.registerJob('bar', { run: function() {} });

		var thrownError;
		try {
			store.registerJob('foo', { run: function() {} });
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.JobAlreadyExistsError, 'Expected %s to  be a JobAlreadyExistsError');
		expect(thrownError.jobName).toBe('foo', 'Expected JobAlreadyExistsError#jobName %s to be %s');
	});

	it('should allow bulk job registration', function() {
		var expectedConfigA = { run: function() {} };
		var expectedConfigB = { run: function() {} };

		var store = new JobConfigStore();

		store.registerJobs({
			foo: expectedConfigA,
			bar: expectedConfigB
		});

		var jobConfigA = store.getJobConfig('foo');
		expect(jobConfigA).toBeA(Object);
		expect(jobConfigA.jobName).toBe('foo');
		expect(jobConfigA.run).toBe(expectedConfigA.run);

		var jobConfigB = store.getJobConfig('bar');
		expect(jobConfigB).toBeA(Object);
		expect(jobConfigB.jobName).toBe('bar');
		expect(jobConfigB.run).toBe(expectedConfigB.run);
	});

	it('should allow unregistering a job and emit JOB_UNREGISTERED', function() {
		var expectedConfig = { run: function() {} };
		var store = new JobConfigStore();

		var spyUnregisteredEvent = expect.createSpy().andCall(function() {
			expect(arguments.length).toBe(2, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe('foo', 'Expected arguments[0] %s to be %s');
			expect(arguments[1]).toNotBe(expectedConfig, 'Expected arguments[1] %s to be not be original config');
			expect(arguments[1]).toBeA(Object, 'Expected arguments[1] %s to be a %s');
			expect(arguments[1].jobName).toBe('foo', 'Expected arguments[1].jobName %s to be %s');
			expect(arguments[1].run).toBe(expectedConfig.run, 'Expected arguments[1].run %s to be original function');
		});
		store.on('JOB_UNREGISTERED', spyUnregisteredEvent);

		store.registerJob('foo', expectedConfig);
		expect(store.unregisterJob('foo')).toBe(store, 'Expected return of JobConfigStore#unregisterJob %s to be itself (i.e. this)');
		expect(store.getJobConfig('foo')).toBe(null);

		expect(spyUnregisteredEvent.calls.length).toBe(1, 'Expected JOB_UNREGISTERED emit count %s to be %s');
	});

	it('should allow all jobs to be unregistered', function() {
		var store = new JobConfigStore();

		var spyUnregisteredEvent = expect.createSpy();
		store.on('JOB_UNREGISTERED', spyUnregisteredEvent);

		store.registerJob('foo', { run: function() {} });
		store.registerJob('bar', { run: function() {} });
		expect(store.unregisterAllJobs()).toBe(store, 'Expected return of JobConfigStore#unregisterAllJobs %s to be itself (i.e. this)');

		expect(spyUnregisteredEvent.calls.length).toBe(2, 'Expected JOB_UNREGISTERED emit count %s to be %s');
		expect(store.getJobConfig('foo')).toBe(null);
		expect(store.getJobConfig('bar')).toBe(null);
	});

	it('should return job names from getRegisteredJobNames', function() {
		var store = new JobConfigStore();

		store.registerJob('foo', { run: function() {} });
		store.registerJob('bar', { run: function() {} });

		expect(store.getRegisteredJobNames()).toEqual(['foo', 'bar']);
	});
});
