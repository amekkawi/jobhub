var constants = require('../../lib/constants');
var errors = require('../../lib/errors');
var expect = require('expect');
var MiddlewareStore = require('../../lib/MiddlewareStore');
var TrackedJob = require('../../lib/TrackedJob');
var EventEmitter = require('events').EventEmitter;
var JobWorkerIPCMediator = require('../../lib/JobWorkerIPCMediator');

describe('TrackedJob', function() {
	function createManagerFixture(overrides) {
		overrides = overrides || {};
		return {
			options: Object.assign({}, overrides.options || {}),
			middleware: new MiddlewareStore()
				.addSupportedSyncTypes([
					constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR
				])
		};
	}

	function createJobWorkerMediatorFixture(trackedJob, overrides) {
		return Object.assign(new EventEmitter(), {
			trackedJob: trackedJob,
			startWorker: function() {
				new Error('Expected to not call JobWorkerMediator#startWorker');
			},
			stopMediation: function() {
				throw new Error('Expected to not call JobWorkerMediator#stopMediation');
			}
		}, overrides);
	}

	function createChildProcessFixture() {
		return Object.assign(new EventEmitter(), {
			pid: 999999,
			connected: true,
			disconnect: function() {
				throw new Error('Expected to not call ChildProcess#disconnect');
			},
			kill: function() {
				throw new Error('Expected to not call ChildProcess#kill');
			},
			send: function() {
				throw new Error('Expected to not call ChildProcess#send');
			}
		});
	}

	it('should set properties from constructor and extend from EventEmitter', function() {
		var manager = createManagerFixture();
		var jobConfig = {
			jobName: 'foo',
			run: function() {}
		};
		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);
		expect(trackedJob.created).toBeA(Date, 'Expected TrackedJob#created %s to be a %s');
		expect(trackedJob.stage).toBe(null, 'Expected TrackedJob#stage %s to be a %s');
		expect(trackedJob.manager).toBe(manager, 'Expected TrackedJob#manager %s to be %s');
		expect(trackedJob.jobId).toBe('FOO', 'Expected TrackedJob#jobId %s to be %s');
		expect(trackedJob.jobConfig).toBe(jobConfig, 'Expected TrackedJob#jobConfig %s to be %s');
		expect(trackedJob.params).toBe(params, 'Expected TrackedJob#params %s to be %s');
		expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
		expect(trackedJob.isSettled).toBe(false, 'Expected TrackedJob#isSettled %s to be %s');
		expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
		expect(trackedJob.error).toBe(null, 'Expected TrackedJob#error %s to be %s');
		expect(trackedJob.aborted).toBe(false, 'Expected TrackedJob#aborted %s to be %s');
		expect(trackedJob.abortReason).toBe(null, 'Expected TrackedJob#abortReason %s to be %s');
		expect(trackedJob.promise).toBe(null, 'Expected TrackedJob#promise %s to be %s');
		expect(trackedJob.workerMediator).toBe(null, 'Expected TrackedJob#workerMediator %s to be %s');
		expect(trackedJob.progress).toBe(null, 'Expected TrackedJob#progress %s to be %s');
		expect(trackedJob instanceof EventEmitter).toBe(true, 'Expected TrackedJob to be instance of EventEmitter');
	});

	it('should ignore calls to abort if not running', function() {
		var manager = createManagerFixture();
		var trackedJob = new TrackedJob(manager, 'FOO', { run: function() {} }, {});

		trackedJob.abort('foo');
		expect(trackedJob.aborted).toBe(false);
		expect(trackedJob.abortReason).toBe(null);
	});

	it('should set props and emit "jobStarted" when run', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();

		var jobConfig = {
			validate: function() {
				throw new Error('Expected not to be called');
			},
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		var spyStartedEvent = expect.createSpy().andCall(function() {
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage in event %s to be %s');
			expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning in event %s to be %s');
			expect(trackedJob.isSettled).toBe(false, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(null, 'Expected TrackedJob#error %s to be %s');

			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(0, 'Expected arguments count %s to be %s');

			// Throws an error that should be caught by the promise chain
			throw expectedError;
		});
		trackedJob.on(constants.EVENT_JOB_STARTED, spyStartedEvent);

		// Synchronous checks
		expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
		expect(trackedJob.run()).toBe(trackedJob, 'Expected return of TrackedJob#run() %s to be trackedJob (i.e. this)');
		expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning %s to be %s');
		expect(trackedJob.isSettled).toBe(false, 'Expected TrackedJob#isSettled in event %s to be %s');
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(trackedJob.promise).toBeA(Promise, 'Expected TrackedJob#promise %s to be a Promise');
		expect(spyStartedEvent.calls.length).toBe(0, 'Expected "jobStarted" emit count %s to be %s');

		return trackedJob.promise.then(function() {
			throw new Error('Expected not to resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(expectedError, 'Expected TrackedJob#error %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(spyStartedEvent.calls.length).toBe(1, 'Expected "validateParams" emit count %s to be %s');
		});
	});

	it('should call JobConfig#validate', function() {
		var manager = createManagerFixture();
		var expectedError = new errors.InvalidJobParamError('nope!', 'foo', void 0);

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning %s to now be %s');
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob stage %s to be %s');

				expect(this).toBe(jobConfig, 'Expected context %s to be jobConfig');
				expect(arguments.length).toBe(2, 'Expected arguments length %s to be %s');
				expect(arguments[0]).toBe(params, 'Expected arguments[0] %s to be params');
				expect(arguments[1]).toBe(errors.InvalidJobParamError, 'Expected arguments[1] %s to be InvalidJobParamError');

				throw expectedError;
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		// Check event again but without throwing an error
		var spyStartedEvent = expect.createSpy().andCall(function() {
			expect(jobConfig.validate.calls.length).toBe(0, 'Expected JobConfig#validate call count %s to be %s');
		});
		trackedJob.on(constants.EVENT_JOB_STARTED, spyStartedEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyStartedReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobStarted" context %s to be emitter');
			expect(arguments.length).toBe(1, 'Expected re-emit "jobStarted" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobStarted" arguments[0] %s to be trackedJob');
		});
		emitter.on(constants.EVENT_JOB_STARTED, spyStartedReEmit);

		var spyFailureEvent = expect.createSpy().andCall(function(err) {
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be thrown error');
		});
		trackedJob.on(constants.EVENT_JOB_FAILURE, spyFailureEvent);

		var spyFailureReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobFailure" context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit "jobFailure" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobFailure" arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(expectedError, 'Expected re-emit "jobFailure" arguments[1] %s to be thrown error');
		});
		emitter.on(constants.EVENT_JOB_FAILURE, spyFailureReEmit);

		// Synchronous checks
		trackedJob.run();
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(spyStartedEvent.calls.length).toBe(0, 'Expected "jobStarted" emit count %s to be %s');
		expect(spyFailureEvent.calls.length).toBe(0, 'Expected "jobFailure" emit count %s to be %s');
		expect(jobConfig.validate.calls.length).toBe(0, 'Expected validate call count %s to be %s');

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(expectedError, 'Expected TrackedJob#error %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(jobConfig.validate.calls.length).toBe(1, 'Expected validate call count %s to be %s');
			expect(spyStartedEvent.calls.length).toBe(1, 'Expected "jobStarted" emit count %s to be %s');
			expect(spyStartedReEmit.calls.length).toBe(1, 'Expected "jobStarted" re-emit count %s to be %s');
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected "jobFailure" emit count %s to be %s');
			expect(spyFailureReEmit.calls.length).toBe(1, 'Expected "jobFailure" re-emit count %s to be %s');
		});
	});

	it('should allow JobConfig#validate to return a promise', function() {
		var manager = createManagerFixture();
		var expectedError = new errors.InvalidJobParamError('nope!', 'foo', void 0);

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				return Promise.reject(expectedError);
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}
		});
	});

	it('should allow job to be aborted immediately after called run', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			validate: expect.createSpy(),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spyAbortEvent = expect.createSpy();
		trackedJob.on(constants.EVENT_JOB_ABORT, spyAbortEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyAbortReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobAbort" context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit "jobAbort" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobAbort" arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(trackedJob.abortReason, 'Expected re-emit "jobAbort" arguments[1] %s to be abort reason');
		});
		emitter.on(constants.EVENT_JOB_ABORT, spyAbortReEmit);

		trackedJob.run();

		trackedJob.abort('foo');
		expect(trackedJob.aborted).toBe(true);
		expect(trackedJob.abortReason).toBe('foo');

		expect(spyAbortEvent.calls.length).toBe(1);
		expect(spyAbortEvent.calls[0].arguments.length).toBe(1);
		expect(spyAbortEvent.calls[0].arguments[0]).toBe('foo');

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(jobConfig.validate.calls.length).toBe(0);
			expect(err.jobName).toBe(trackedJob.jobConfig.jobName);
			expect(err.jobId).toBe(trackedJob.jobId);
			expect(err.abortReason).toBe('foo');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(spyAbortEvent.calls.length).toBe(1);
		});
	});

	it('should default abort reason', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spyAbortEvent = expect.createSpy();
		trackedJob.on(constants.EVENT_JOB_ABORT, spyAbortEvent);

		trackedJob.run();

		trackedJob.abort();
		expect(trackedJob.aborted).toBe(true);
		expect(trackedJob.abortReason).toBe('No reason specified');

		expect(spyAbortEvent.calls.length).toBe(1);
		expect(spyAbortEvent.calls[0].arguments.length).toBe(1);
		expect(spyAbortEvent.calls[0].arguments[0]).toBe('No reason specified');

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(err.jobName).toBe(trackedJob.jobConfig.jobName);
			expect(err.jobId).toBe(trackedJob.jobId);
			expect(err.abortReason).toBe('No reason specified');
			expect(spyAbortEvent.calls.length).toBe(1);
		});
	});

	it('should ignore further abort calls', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spyAbortEvent = expect.createSpy();
		trackedJob.on(constants.EVENT_JOB_ABORT, spyAbortEvent);

		trackedJob.run();

		trackedJob.abort('foo');
		expect(trackedJob.aborted).toBe(true);
		expect(trackedJob.abortReason).toBe('foo');

		trackedJob.abort('bar');
		expect(trackedJob.aborted).toBe(true);
		expect(trackedJob.abortReason).toBe('foo');

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(err.abortReason).toBe('foo');
			expect(spyAbortEvent.calls.length).toBe(1);
		});
	});

	it('should allow abort during validate', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				return new Promise(function() {
					expect(trackedJob.aborted).toBe(false);
					expect(spyAbortEvent.calls.length).toBe(0);

					// Abort job and never resolve validation
					trackedJob.abort('foo');

					expect(trackedJob.aborted).toBe(true);
					expect(trackedJob.abortReason).toBe('foo');
					expect(spyAbortEvent.calls.length).toBe(1);
					expect(spyAbortEvent.calls[0].arguments.length).toBe(1);
					expect(spyAbortEvent.calls[0].arguments[0]).toBe('foo');
				});
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spyAbortEvent = expect.createSpy();
		trackedJob.on(constants.EVENT_JOB_ABORT, spyAbortEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(err.jobName).toBe(trackedJob.jobConfig.jobName);
			expect(err.jobId).toBe(trackedJob.jobId);
			expect(err.abortReason).toBe('foo');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(spyAbortEvent.calls.length).toBe(1);
		});
	});

	it('should ignore abort if job no longer running', function() {
		var expectedError = new errors.InvalidJobParamError('nope!', 'foo', void 0);
		var manager = createManagerFixture();

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				throw expectedError;
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spyAbortEvent = expect.createSpy();
		trackedJob.on(constants.EVENT_JOB_ABORT, spyAbortEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}

			trackedJob.abort('bar');

			expect(trackedJob.aborted).toBe(false);
			expect(trackedJob.abortReason).toBe(null);
			expect(spyAbortEvent.calls.length).toBe(0);
		});
	});

	it('should not abort if validate already rejected', function() {
		var manager = createManagerFixture();
		var expectedError = new errors.InvalidJobParamError('nope!', 'foo', void 0);

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				return new Promise(function(resolve, reject) {
					reject(expectedError);

					// Abort job
					trackedJob.abort('foo');
				})
					.catch(function(err) {
						// Add an extra step to verify enough time is given.
						throw err;
					})
					.catch(function(err) {
						// Add an extra step to verify enough time is given.
						throw err;
					});
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError && !(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(err).toBe(expectedError);
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		});
	});

	it('should still abort if validate already resolved', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				return new Promise(function(resolve) {
					resolve();

					// Abort job
					trackedJob.abort('foo');
				});
			}),
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			// Should be the next stage, since validation was resolved.
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
		});
	});

	it('should call quickRun and allow it to resolve', function() {
		var expectedResult = {};
		var manager = createManagerFixture();

		var params = {
			boolT: true,
			boolF: false,
			num0: 0,
			num1: 1,
			inf: Infinity,
			infNeg: -Infinity,
			nan: NaN,
			undef: void 0,
			arr: [],
			func: function(){},
			obj: {},
			regex: /^$/
		};

		var paramsCleaned = JSON.parse(JSON.stringify(params));

		var jobConfig = {
			validate: expect.createSpy().andCall(function() {
				expect(jobConfig.quickRun.calls.length).toBe(0, 'Expected quickRun call count %s to be %s');
				expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning %s to now be %s');
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob stage %s to be %s');
			}),
			quickRun: expect.createSpy().andCall(function() {
				expect(jobConfig.validate.calls.length).toBe(1, 'Expected validate call count %s to be %s');
				expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning %s to now be %s');
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
				expect(arguments.length).toBe(2, 'Expected quickRun arguments count %s to be %s');
				expect(arguments[0]).toBeA(Object, 'Expected quickRun arguments[0] type %s to be an object');
				expect(Object.keys(arguments[0]).length).toBe(6);
				expect(arguments[0].jobId).toBe('FOO', 'Expected quickRun arguments[0].jobId %s to be %s');
				expect(arguments[0].params).toBeA(Object, 'Expected quickRun arguments[0].params type %s to be an object');
				expect(Object.keys(arguments[0].params)).toEqual(Object.keys(paramsCleaned), 'Expected quickRun arguments[0].params keys %s to equal %s');
				expect(arguments[0].params).toEqual(paramsCleaned, 'Expected quickRun arguments[0].params %s to equal %s');
				expect(arguments[0].resolve).toBeA(Function, 'Expected quickRun arguments[0].resolve %s to be a function');
				expect(arguments[0].reject).toBeA(Function, 'Expected quickRun arguments[0].reject %s to be a function');
				expect(arguments[0].sendProgress).toBeA(Function, 'Expected quickRun arguments[0].sendProgress %s to be a function');
				expect(arguments[0].onAbort).toBeA(Function, 'Expected quickRun arguments[0].onAbort %s to be a function');
				expect(arguments[1]).toBeA(Function, 'Expected quickRun arguments[1] %s to be a function');
				arguments[0].resolve(expectedResult);
			}),
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		var spySuccessEvent = expect.createSpy().andCall(function() {
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedResult, 'Expected arguments[0] %s to be %s');
		});
		trackedJob.on(constants.EVENT_JOB_SUCCESS, spySuccessEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spySuccessReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobSuccess" context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit "jobSuccess" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobSuccess" arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(expectedResult, 'Expected re-emit "jobSuccess" arguments[1] %s to be %s');
		});
		emitter.on(constants.EVENT_JOB_SUCCESS, spySuccessReEmit);

		trackedJob.run();
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(jobConfig.validate.calls.length).toBe(0, 'Expected validate call count %s to be %s');
		expect(spySuccessEvent.calls.length).toBe(0, 'Expected "jobSuccess" emit count %s to be %s');
		expect(jobConfig.quickRun.calls.length).toBe(0, 'Expected quickRun call count %s to be %s');

		return trackedJob.promise.then(function(val) {
			expect(jobConfig.validate.calls.length).toBe(1, 'Expected validate call count %s to be %s');
			expect(jobConfig.quickRun.calls.length).toBe(1, 'Expected quickRun call count %s to be %s');
			expect(spySuccessEvent.calls.length).toBe(1, 'Expected "jobSuccess" emit count %s to be %s');
			expect(spySuccessReEmit.calls.length).toBe(1, 'Expected "jobSuccess" re-emit count %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(expectedResult, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(null, 'Expected TrackedJob#error %s to be %s');
			expect(val).toBe(expectedResult, 'Expected result %s to be %s');
		});
	});

	it('should allow quickRun to reject', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function() {
				arguments[0].reject(expectedError);
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		var spyFailureEvent = expect.createSpy().andCall(function(err) {
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be thrown error');
		});
		trackedJob.on(constants.EVENT_JOB_FAILURE, spyFailureEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(expectedError, 'Expected TrackedJob#error %s to be %s');
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected "jobFailure" emit count %s to be %s');
		});
	});

	it('should reject if quickRun throws synchronously', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function() {
				throw expectedError;
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		var spyFailureEvent = expect.createSpy().andCall(function(err) {
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be thrown error');
		});
		trackedJob.on(constants.EVENT_JOB_FAILURE, spyFailureEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
			expect(trackedJob.result).toBe(null, 'Expected TrackedJob#result %s to be %s');
			expect(trackedJob.error).toBe(expectedError, 'Expected TrackedJob#error %s to be %s');
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected "jobFailure" emit count %s to be %s');
		});
	});

	it('should allow abort during quickRun and allow quickRun to listen to jobAbort event', function() {
		var manager = createManagerFixture();
		var spyOnAbort = expect.createSpy();

		var jobConfig = {
			quickRun: function() {
				arguments[0].onAbort(spyOnAbort);
				trackedJob.abort('foo');

				expect(spyOnAbort.calls.length).toBe(1);
				expect(spyOnAbort.calls[0].arguments.length).toBe(1);
				expect(spyOnAbort.calls[0].arguments[0]).toBe('foo');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(spyOnAbort.calls.length).toBe(1);
			expect(spyOnAbort.calls[0].arguments.length).toBe(1);
			expect(spyOnAbort.calls[0].arguments[0]).toBe('foo');

			// Should only be called once.
			trackedJob.emit(constants.EVENT_JOB_ABORT, 'bar');
			expect(spyOnAbort.calls.length).toBe(1);
		});
	});

	it('should not abort if quickRun already rejected', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();

		var jobConfig = {
			quickRun: function(job) {
				job.reject(expectedError);

				trackedJob.abort('foo');
				expect(trackedJob.aborted).toBe(true);
				expect(trackedJob.abortReason).toBe('foo');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.aborted).toBe(true);
			expect(trackedJob.abortReason).toBe('foo');
		});
	});

	it('should not abort if quickRun already resolved', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			quickRun: function(job) {
				job.resolve();

				trackedJob.abort('foo');
				expect(trackedJob.aborted).toBe(true);
				expect(trackedJob.abortReason).toBe('foo');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			expect(trackedJob.aborted).toBe(true);
			expect(trackedJob.abortReason).toBe('foo');
		});
	});

	it('should still abort if quickRun already called next', function() {
		var manager = createManagerFixture();

		var jobConfig = {
			quickRun: function(job, next) {
				next();
				trackedJob.abort('foo');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			// Should be the next stage.
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.workerMediator).toBe(null, 'Expected TrackedJob#workerMediator %s to be %s');
		});
	});

	it('should catch error thrown in "jobSuccess" event handlers', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function() {
				arguments[0].resolve({});
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_SUCCESS, function() {
			throw expectedError;
		});

		return trackedJob.run().promise
			.then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				// Rethrow error if not the expected one
				if (err !== expectedError) {
					throw err;
				}
			});
	});

	it('should catch error thrown in "jobFailure" event handlers', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function() {
				throw new Error();
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FAILURE, function() {
			throw expectedError;
		});

		return trackedJob.run().promise
			.then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				// Rethrow error if not the expected one
				if (err !== expectedError) {
					throw err;
				}
			});
	});

	it('should allow middleware to intercept creating worker mediator', function() {
		var manager = createManagerFixture();
		var workerMediator;
		var expectedError;

		var spyJobForkedEvent = expect.createSpy();

		var spyStartWorker = expect.createSpy()
			.andCall(function() {
				expect(workerMediator.on.calls.length).toBe(3);
				expect(workerMediator.on.calls[0].arguments.length).toBe(2);
				expect(workerMediator.on.calls[0].arguments[0]).toBe(constants.EVENT_JOB_SUCCESS);
				expect(workerMediator.on.calls[0].arguments[1]).toBeA(Function);
				expect(workerMediator.on.calls[1].arguments.length).toBe(2);
				expect(workerMediator.on.calls[1].arguments[0]).toBe(constants.EVENT_JOB_FAILURE);
				expect(workerMediator.on.calls[1].arguments[1]).toBeA(Function);
				expect(workerMediator.on.calls[2].arguments.length).toBe(2);
				expect(workerMediator.on.calls[2].arguments[0]).toBe(constants.EVENT_JOB_PROGRESS);
				expect(workerMediator.on.calls[2].arguments[1]).toBeA(Function);

				expect(spyStartWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
				expect(spyCreateMediator.calls.length).toBe(1, 'Expected "createWorkerMediator" emit count %s to be %s');

				expect(trackedJob.workerMediator).toBe(workerMediator, 'Expected TrackedJob#workerMediator %s to be %s');
				expect(arguments.length).toBe(0, 'Expected arguments count %s to be %s');

				return Promise.reject(expectedError = new Error());
			});

		var spyCreateMediator = expect.createSpy()
			.andCall(function() {
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_RUN, 'Expected TrackedJob stage %s to be %s');

				expect(spyStartWorker.calls.length).toBe(0, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
				expect(spyCreateMediator.calls.length).toBe(1, 'Expected "createWorkerMediator" emit count %s to be %s');

				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
				expect(arguments[1]).toBeA(Function, 'Expected arguments[1] %s to be a %s');

				// Check what would have been returned if not intercepted
				var origRet = arguments[1](); // Next
				expect(origRet).toBeA(JobWorkerIPCMediator, 'Expected result of next %s to be a JobWorkerIPCMediator');

				workerMediator = createJobWorkerMediatorFixture(this, {
					startWorker: spyStartWorker
				});

				expect.spyOn(workerMediator, 'on').andCallThrough();

				return workerMediator;
			});

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			spyCreateMediator
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FORKED, spyJobForkedEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(spyJobForkedEvent.calls.length).toBe(0, 'Expected "jobForked" emit count %s to be %s');
			expect(spyCreateMediator.calls.length).toBe(1, 'Expected middleware call count %s to be %s');
			expect(spyStartWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
			expect(trackedJob.workerMediator).toBe(workerMediator, 'Expected TrackedJob#workerMediator %s to be %s');
		});
	});

	it('should emit "jobForked" and catch thrown errors', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		var spyForkedEvent = expect.createSpy().andCall(function() {
			expect(arguments.length).toBe(0, 'Expected arguments count %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			throw expectedError;
		});
		trackedJob.on(constants.EVENT_JOB_FORKED, spyForkedEvent);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(spyForkedEvent.calls.length).toBe(1, 'Expected "jobForked" emit count %s to be %s');
		});
	});

	it('should allow mediator to resolve', function() {
		var manager = createManagerFixture();
		var expectedResult = {};

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		var spyForkedEvent = expect.createSpy().andCall(function() {
			trackedJob.workerMediator.emit(constants.EVENT_JOB_SUCCESS, expectedResult);
		});
		trackedJob.on(constants.EVENT_JOB_FORKED, spyForkedEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyForkedReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobForked" context %s to be emitter');
			expect(arguments.length).toBe(1, 'Expected re-emit "jobForked" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobForked" arguments[0] %s to be trackedJob');
		});
		emitter.on(constants.EVENT_JOB_FORKED, spyForkedReEmit);

		trackedJob.run();

		return trackedJob.promise.then(function(ret) {
			expect(spyForkedEvent.calls.length).toBe(1, 'Expected "jobForked" emit count %s to be %s');
			expect(spyForkedReEmit.calls.length).toBe(1, 'Expected "jobForked" re-emit count %s to be %s');
			expect(ret).toBe(expectedResult, 'Expected job result %s to be %s');
		});
	});

	it('should allow mediator to reject', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FORKED, function() {
			trackedJob.workerMediator.emit(constants.EVENT_JOB_FAILURE, expectedError);
		});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}
		});
	});

	it('should not abort if mediator already handled success', function() {
		var manager = createManagerFixture();
		var expectedResult = {};

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FORKED, function() {
			trackedJob.workerMediator.settled = true;
			trackedJob.workerMediator.emit(constants.EVENT_JOB_SUCCESS, expectedResult);
			trackedJob.abort('foo');
		});

		trackedJob.run();

		return trackedJob.promise.then(function(ret) {
			expect(ret).toBe(expectedResult, 'Expected job result %s to be %s');
			expect(trackedJob.aborted).toBe(true);
			expect(trackedJob.abortReason).toBe('foo');
		});
	});

	it('should not abort if mediator already handled error', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FORKED, function() {
			trackedJob.workerMediator.settled = true;
			trackedJob.workerMediator.emit(constants.EVENT_JOB_FAILURE, expectedError);
			trackedJob.abort('foo');
		});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.aborted).toBe(true);
			expect(trackedJob.abortReason).toBe('foo');
		});
	});

	it('should send abort message after worker forked', function() {
		var manager = createManagerFixture();

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return trackedJob.abort('foo');
					},
					sendAbortMessage: expect.createSpy()
				});
			}
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call JobConfig#run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});

		trackedJob.run();

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobAbortedError)) {
				throw err;
			}

			expect(trackedJob.stage).toBe(constants.JOB_STAGE_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.aborted).toBe(true, 'Expected TrackedJob#aborted %s to be %s');
			expect(trackedJob.abortReason).toBe('foo', 'Expected TrackedJob#abortReason %s to be %s');
			expect(trackedJob.workerMediator).toExist();
			expect(trackedJob.workerMediator.sendAbortMessage.calls.length).toBe(1, 'Expected JobWorkerMediator#sendAbortMessage call count %s to be %s');
			expect(trackedJob.workerMediator.sendAbortMessage.calls[0].arguments.length).toBe(0, 'Expected JobWorkerMediator#sendAbortMessage call[0] arguments count %s to be %s');
		});
	});

	it('should emit "jobProgress" for quickRun', function() {
		var progressObj = {
			boolT: true,
			boolF: false,
			num0: 0,
			num1: 1,
			inf: Infinity,
			infNeg: -Infinity,
			nan: NaN,
			undef: void 0,
			arr: [],
			func: function() {},
			obj: {},
			regex: /^$/
		};

		var progressObjCleaned = JSON.parse(JSON.stringify(progressObj));

		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				expect(trackedJob.progress).toBe(null, 'Expected TrackedJob#progress %s to be %s');
				var progressRet = job.sendProgress(progressObj);
				expect(progressRet).toBeA(Promise);
				expect(spyJobProgress.calls.length).toBe(1, 'Expected "jobProgress" emit count %s to be %s');
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		var spyJobProgress = expect.createSpy().andCall(function() {
			expect(trackedJob.isRunning).toBe(true, 'Expected TrackedJob#isRunning %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBeA(Object, 'Expected arguments[0] type %s to be an object');
			expect(Object.keys(arguments[0])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
			expect(arguments[0]).toEqual(progressObjCleaned, 'Expected arguments[0] %s to equal %s');
			expect(arguments[0]).toBe(trackedJob.progress, 'Expected arguments[0] %s to be TrackedJob#progress');
		});
		trackedJob.on(constants.EVENT_JOB_PROGRESS, spyJobProgress);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyProgressReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobProgress" context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit "jobProgress" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobProgress" arguments[0] %s to be trackedJob');
			//expect(arguments[1]).toBe(trackedJob, 'Expected re-emit "jobProgress" arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBeA(Object, 'Expected re-emit "jobProgress" arguments[1] type %s to be an object');
			expect(Object.keys(arguments[1])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
			expect(arguments[1]).toEqual(progressObjCleaned, 'Expected re-emit "jobProgress" arguments[1] %s to equal %s');
			expect(arguments[1]).toBe(trackedJob.progress, 'Expected re-emit "jobProgress" arguments[1] %s to be TrackedJob#progress');
		});
		emitter.on(constants.EVENT_JOB_PROGRESS, spyProgressReEmit);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			expect(spyJobProgress.calls.length).toBe(1, 'Expected "jobProgress" emit count %s to be %s');
			expect(spyProgressReEmit.calls.length).toBe(1, 'Expected "jobProgress" re-emit count %s to be %s');
			expect(trackedJob.progress).toBeA(Object, 'Expected arguments[0] type %s to be an object');
			expect(Object.keys(trackedJob.progress)).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
			expect(trackedJob.progress).toEqual(progressObjCleaned, 'Expected arguments[0] %s to equal %s');
		});
	});

	it('should emit "jobProgress" for run', function() {
		var progressObj = {};
		var manager = createManagerFixture();

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				return createJobWorkerMediatorFixture(this, {
					startWorker: function() {
						return Promise.resolve();
					}
				});
			}
		);

		var jobConfig = {
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

		trackedJob.on(constants.EVENT_JOB_FORKED, function() {
			trackedJob.workerMediator.emit(constants.EVENT_JOB_PROGRESS, progressObj);
			trackedJob.workerMediator.emit(constants.EVENT_JOB_SUCCESS);
		});

		var spyJobProgressEvent = expect.createSpy().andCall(function() {
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(progressObj, 'Expected arguments[0] %s to be %s');
			expect(arguments[0]).toBe(trackedJob.progress, 'Expected arguments[0] %s to be TrackedJob#progress');
		});
		trackedJob.on(constants.EVENT_JOB_PROGRESS, spyJobProgressEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyProgressReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit "jobProgress" context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit "jobProgress" arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit "jobProgress" arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(progressObj, 'Expected re-emit "jobProgress" arguments[1] type %s to be TrackedJob#progress');
		});
		emitter.on(constants.EVENT_JOB_PROGRESS, spyProgressReEmit);

		return trackedJob.run().promise
			.then(function() {
				expect(spyJobProgressEvent.calls.length).toBe(1, 'Expected "jobForked" emit count %s to be %s');
				expect(spyProgressReEmit.calls.length).toBe(1, 'Expected "jobForked" re-emit count %s to be %s');
			});
	});

	it('should return same promise on additional calls to TrackedJob#run', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();

		var jobConfig = {
			validate: function() {
				throw expectedError;
			},
			quickRun: function() {
				throw new Error('Expected not to be called');
			},
			run: function() {
				throw new Error('Expected not to be called');
			}
		};

		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);

		trackedJob.run();
		var promise = trackedJob.promise;
		trackedJob.run();
		expect(trackedJob.promise).toBe(promise, 'Expected TrackedJob#promise %s to be same promise instance');

		return promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.isSettled).toBe(true, 'Expected TrackedJob#isSettled in event %s to be %s');
		});
	});

	describe('TrackedJob#then', function() {
		it('should listen for started event if job not running', function() {
			var manager = createManagerFixture();

			var jobConfig = {
				quickRun: function(job) {
					job.resolve(500);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			var promise = trackedJob.then(function(result) {
				expect(result).toBe(500);
			});

			expect(trackedJob.on.calls.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments[0]).toBe(constants.EVENT_JOB_STARTED);
			expect(trackedJob.on.calls[1].arguments.length).toBe(2);
			expect(trackedJob.on.calls[1].arguments[0]).toBe(constants.EVENT_JOB_FAILURE);

			trackedJob.run();

			return promise;
		});

		it('should listen for failure event if job not running', function() {
			var manager = createManagerFixture();
			var expectedError = new Error();

			var jobConfig = {
				quickRun: function(job) {
					job.reject(expectedError);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			var promise = trackedJob.then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}
			});

			expect(trackedJob.on.calls.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments[0]).toBe(constants.EVENT_JOB_STARTED);
			expect(trackedJob.on.calls[1].arguments.length).toBe(2);
			expect(trackedJob.on.calls[1].arguments[0]).toBe(constants.EVENT_JOB_FAILURE);

			trackedJob.run();

			return promise;
		});

		it('should chain directly off of TrackedJob#promise if job running', function() {
			var manager = createManagerFixture();

			var jobConfig = {
				quickRun: function(job) {
					job.resolve(500);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			trackedJob.run();

			var promise = trackedJob.then(function(result) {
				expect(result).toBe(500);
			});

			expect(trackedJob.on.calls.length).toBe(0);

			return promise;
		});
	});

	describe('TrackedJob#catch', function() {
		it('should listen for started event if job not running', function() {
			var manager = createManagerFixture();
			var expectedError = new Error();

			var jobConfig = {
				quickRun: function(job) {
					job.reject(expectedError);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			var promise = trackedJob.catch(function(err) {
				if (err !== expectedError) {
					throw err;
				}
			});

			expect(trackedJob.on.calls.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments[0]).toBe(constants.EVENT_JOB_STARTED);
			expect(trackedJob.on.calls[1].arguments.length).toBe(2);
			expect(trackedJob.on.calls[1].arguments[0]).toBe(constants.EVENT_JOB_FAILURE);

			trackedJob.run();

			return promise;
		});

		it('should listen for failure event if job not running', function() {
			var manager = createManagerFixture();
			var expectedError = new Error();

			var jobConfig = {
				quickRun: function(job) {
					job.reject(expectedError);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			var promise = new Promise(function(resolve, reject) {
				trackedJob.catch(function(err) {
					if (err !== expectedError) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			});

			expect(trackedJob.on.calls.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments.length).toBe(2);
			expect(trackedJob.on.calls[0].arguments[0]).toBe(constants.EVENT_JOB_STARTED);
			expect(trackedJob.on.calls[1].arguments.length).toBe(2);
			expect(trackedJob.on.calls[1].arguments[0]).toBe(constants.EVENT_JOB_FAILURE);

			trackedJob.run();

			return promise;
		});

		it('should chain directly off of TrackedJob#promise if job running', function() {
			var manager = createManagerFixture();
			var expectedError = new Error();

			var jobConfig = {
				quickRun: function(job) {
					job.reject(expectedError);
				},
				run: function() {
					throw new Error('Expected not to be called');
				}
			};

			var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});

			expect.spyOn(trackedJob, 'on').andCallThrough();

			trackedJob.run();

			var promise = new Promise(function(resolve, reject) {
				trackedJob.catch(function(err) {
					if (err !== expectedError) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			});

			expect(trackedJob.on.calls.length).toBe(0);

			return promise;
		});
	});
});
