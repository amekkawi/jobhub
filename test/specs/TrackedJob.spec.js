var path = require('path');
var ChildProcess = require('child_process').ChildProcess;
var fork = require('child_process').fork;
var constants = require('../../lib/constants');
var errors = require('../../lib/errors');
var expect = require('expect');
var util = require('../../lib/util');
var MiddlewareStore = require('../../lib/MiddlewareStore');
var TrackedJob = require('../../lib/TrackedJob');
var EventEmitter = require('events').EventEmitter;
var JobWorkerIPCMediator = require('../../lib/JobWorkerIPCMediator');

describe('TrackedJob', function() {
	var badWorkerPath = path.join(__dirname, '..', 'fixtures', 'bad-worker.js');

	function createManagerFixture(overrides) {
		overrides = overrides || {};
		return {
			options: Object.assign({
				forkModulePath: badWorkerPath,
				workerStartupTimeout: 1
			}, overrides.options || {}),
			middleware: new MiddlewareStore()
				.addSupportedSyncTypes([
					constants.MIDDLEWARE_FORK_JOB_PROCESS,
					constants.MIDDLEWARE_BUILD_FORK_ARGS,
					constants.MIDDLEWARE_BUILD_FORK_OPTS,
					constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR
				])
		};
	}

	function createJobWorkerMediatorFixture(trackedJob, overrides) {
		return Object.assign({
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
		expect(trackedJob.manager).toBe(manager, 'Expected TrackedJob#manager %s to be %s');
		expect(trackedJob.jobId).toBe('FOO', 'Expected TrackedJob#jobId %s to be %s');
		expect(trackedJob.jobConfig).toBe(jobConfig, 'Expected TrackedJob#jobConfig %s to be %s');
		expect(trackedJob.params).toBe(params, 'Expected TrackedJob#params %s to be %s');
		expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
		expect(trackedJob.promise).toBe(null, 'Expected TrackedJob#promise %s to be %s');
		expect(trackedJob.workerMediator).toBe(null, 'Expected TrackedJob#workerMediator %s to be %s');
		expect(trackedJob instanceof EventEmitter).toBe(true, 'Expected TrackedJob#trackedJob to be instance of EventEmitter');
	});

	it('should return a rejected promise from TrackedJob#then if not yet started', function() {
		var trackedJob = new TrackedJob({}, 'FOO', {}, {});
		expect(trackedJob.promise).toBe(null);
		return trackedJob.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			expect(err).toBeA(Error);
			expect(err.message).toBe('Cannot use TackedJob#then as Promise until TrackedJob#run is called');
		});
	});

	it('should return a rejected promise from TrackedJob#catch if not yet started', function() {
		var trackedJob = new TrackedJob({}, 'FOO', {}, {});
		expect(trackedJob.promise).toBe(null);
		return trackedJob.catch(function(err) {
			expect(err).toBeA(Error);
			expect(err.message).toBe('Cannot use TackedJob#catch as Promise until TrackedJob#run is called');
		});
	});

	it('should set props and emit EVENT_JOB_STARTED when run', function() {
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
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(trackedJob.promise).toBeA(Promise, 'Expected TrackedJob#promise %s to be a Promise');
		expect(spyStartedEvent.calls.length).toBe(1, 'Expected EVENT_JOB_STARTED emit count %s to be %s');

		return trackedJob.promise.then(function() {
			throw new Error('Expected not to resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(spyStartedEvent.calls.length).toBe(1, 'Expected JOB_STAGE_VALIDATE_PARAMS emit count %s to be %s');
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
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_STARTED context %s to be emitter');
			expect(arguments.length).toBe(1, 'Expected re-emit EVENT_JOB_STARTED arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_STARTED arguments[0] %s to be trackedJob');
		});
		emitter.on(constants.EVENT_JOB_STARTED, spyStartedReEmit);

		var spyFailureEvent = expect.createSpy().andCall(function(err) {
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be thrown error');
		});
		trackedJob.on(constants.EVENT_JOB_FAILURE, spyFailureEvent);

		var spyFailureReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_FAILURE context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit EVENT_JOB_FAILURE arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_FAILURE arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(expectedError, 'Expected re-emit EVENT_JOB_FAILURE arguments[1] %s to be thrown error');
		});
		emitter.on(constants.EVENT_JOB_FAILURE, spyFailureReEmit);

		// Synchronous checks
		trackedJob.run();
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(spyStartedEvent.calls.length).toBe(1, 'Expected EVENT_JOB_STARTED emit count %s to be %s');
		expect(spyFailureEvent.calls.length).toBe(0, 'Expected EVENT_JOB_FAILURE emit count %s to be %s');
		expect(jobConfig.validate.calls.length).toBe(0, 'Expected validate call count %s to be %s');

		return trackedJob.promise.then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== expectedError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
			expect(jobConfig.validate.calls.length).toBe(1, 'Expected validate call count %s to be %s');
			expect(spyStartedEvent.calls.length).toBe(1, 'Expected EVENT_JOB_STARTED emit count %s to be %s');
			expect(spyStartedReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_STARTED re-emit count %s to be %s');
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FAILURE emit count %s to be %s');
			expect(spyFailureReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_FAILURE re-emit count %s to be %s');
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
				expect(arguments[0].jobId).toBe('FOO', 'Expected quickRun arguments[0].jobId %s to be %s');
				expect(arguments[0].params).toBeA(Object, 'Expected quickRun arguments[0].params type %s to be an object');
				expect(Object.keys(arguments[0].params)).toEqual(Object.keys(paramsCleaned), 'Expected quickRun arguments[0].params keys %s to equal %s');
				expect(arguments[0].params).toEqual(paramsCleaned, 'Expected quickRun arguments[0].params %s to equal %s');
				expect(arguments[0].resolve).toBeA(Function, 'Expected quickRun arguments[0].resolve %s to be a function');
				expect(arguments[0].reject).toBeA(Function, 'Expected quickRun arguments[0].reject %s to be a function');
				expect(arguments[0].sendProgress).toBeA(Function, 'Expected quickRun arguments[0].sendProgress %s to be a function');
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
			expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
			expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
			expect(arguments[0]).toBe(expectedResult, 'Expected arguments[0] %s to be %s');
		});
		trackedJob.on(constants.EVENT_JOB_SUCCESS, spySuccessEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spySuccessReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_SUCCESS context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit EVENT_JOB_SUCCESS arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_SUCCESS arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(expectedResult, 'Expected re-emit EVENT_JOB_SUCCESS arguments[1] %s to be %s');
		});
		emitter.on(constants.EVENT_JOB_SUCCESS, spySuccessReEmit);

		trackedJob.run();
		expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob#stage %s to be %s');
		expect(jobConfig.validate.calls.length).toBe(0, 'Expected validate call count %s to be %s');
		expect(spySuccessEvent.calls.length).toBe(0, 'Expected EVENT_JOB_SUCCESS emit count %s to be %s');
		expect(jobConfig.quickRun.calls.length).toBe(0, 'Expected quickRun call count %s to be %s');

		return trackedJob.promise.then(function(val) {
			expect(jobConfig.validate.calls.length).toBe(1, 'Expected validate call count %s to be %s');
			expect(jobConfig.quickRun.calls.length).toBe(1, 'Expected quickRun call count %s to be %s');
			expect(spySuccessEvent.calls.length).toBe(1, 'Expected EVENT_JOB_SUCCESS emit count %s to be %s');
			expect(spySuccessReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_SUCCESS re-emit count %s to be %s');
			expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob#stage %s to be %s');
			expect(trackedJob.isRunning).toBe(false, 'Expected TrackedJob#isRunning %s to be %s');
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
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FAILURE emit count %s to be %s');
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
			expect(spyFailureEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FAILURE emit count %s to be %s');
		});
	});

	it('should catch error thrown in EVENT_JOB_SUCCESS', function() {
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

		return trackedJob.run()
			.then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				// Rethrow error if not the expected one
				if (err !== expectedError) {
					throw err;
				}
			});
	});

	it('should catch error thrown in EVENT_JOB_FAILURE', function() {
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

		return trackedJob.run()
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
				expect(spyStartWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
				expect(spyCreateMediator.calls.length).toBe(1, 'Expected MIDDLEWARE_CREATE_WORKER_MEDIATOR emit count %s to be %s');

				expect(trackedJob.workerMediator).toBe(workerMediator, 'Expected TrackedJob#workerMediator %s to be %s');
				expect(arguments.length).toBe(0, 'Expected arguments count %s to be %s');

				return Promise.reject(expectedError = new Error());
			});

		var spyCreateMediator = expect.createSpy()
			.andCall(function() {
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_RUN, 'Expected TrackedJob stage %s to be %s');

				expect(spyStartWorker.calls.length).toBe(0, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
				expect(spyCreateMediator.calls.length).toBe(1, 'Expected MIDDLEWARE_CREATE_WORKER_MEDIATOR emit count %s to be %s');

				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(4, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBeA(Function, 'Expected arguments[0] %s to be a %s');
				expect(arguments[1]).toBeA(Function, 'Expected arguments[1] %s to be a %s');
				expect(arguments[2]).toBeA(Function, 'Expected arguments[2] %s to be a %s');
				expect(arguments[3]).toBeA(Function, 'Expected arguments[3] %s to be a %s');

				// Check what would have been returned if not intercepted
				var origRet = arguments[3](); // Next
				expect(origRet).toBeA(JobWorkerIPCMediator, 'Expected result of next %s to be a JobWorkerIPCMediator');

				return workerMediator = createJobWorkerMediatorFixture(this, {
					startWorker: spyStartWorker
				});
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

			expect(spyJobForkedEvent.calls.length).toBe(0, 'Expected EVENT_JOB_FORKED emit count %s to be %s');
			expect(spyCreateMediator.calls.length).toBe(1, 'Expected middleware call count %s to be %s');
			expect(spyStartWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#startWorker call count %s to be %s');
			expect(trackedJob.workerMediator).toBe(workerMediator, 'Expected TrackedJob#workerMediator %s to be %s');
		});
	});

	it('should emit EVENT_JOB_FORKED and catch thrown errors', function() {
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

			expect(spyForkedEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FORKED emit count %s to be %s');
		});
	});

	it('should allow mediator to resolve', function() {
		var manager = createManagerFixture();
		var expectedResult = {};
		var resolveCb;

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				resolveCb = arguments[1];
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
			resolveCb(expectedResult);
		});
		trackedJob.on(constants.EVENT_JOB_FORKED, spyForkedEvent);

		var emitter = new EventEmitter();
		trackedJob.reEmitTo(emitter);

		var spyForkedReEmit = expect.createSpy().andCall(function() {
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_FORKED context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit EVENT_JOB_FORKED arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_FORKED arguments[0] %s to be trackedJob');
		});
		emitter.on(constants.EVENT_JOB_FORKED, spyForkedReEmit);

		trackedJob.run();

		return trackedJob.promise.then(function(ret) {
			expect(spyForkedEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FORKED emit count %s to be %s');
			expect(spyForkedReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_FORKED re-emit count %s to be %s');
			expect(ret).toBe(expectedResult, 'Expected job result %s to be %s');
		});
	});

	it('should allow mediator to reject', function() {
		var manager = createManagerFixture();
		var expectedError = new Error();
		var rejectCb;

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				rejectCb = arguments[2];
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
			rejectCb(expectedError);
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

	it('should emit EVENT_JOB_PROGRESS for quickRun', function() {
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
				job.sendProgress(progressObj);
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
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_PROGRESS context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit EVENT_JOB_PROGRESS arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_PROGRESS arguments[0] %s to be trackedJob');
			//expect(arguments[1]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_PROGRESS arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBeA(Object, 'Expected re-emit EVENT_JOB_PROGRESS arguments[1] type %s to be an object');
			expect(Object.keys(arguments[1])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
			expect(arguments[1]).toEqual(progressObjCleaned, 'Expected re-emit EVENT_JOB_PROGRESS arguments[1] %s to equal %s');
			expect(arguments[1]).toBe(trackedJob.progress, 'Expected re-emit EVENT_JOB_PROGRESS arguments[1] %s to be TrackedJob#progress');
		});
		emitter.on(constants.EVENT_JOB_PROGRESS, spyProgressReEmit);

		trackedJob.run();

		return trackedJob.promise.then(function() {
			expect(spyJobProgress.calls.length).toBe(1, 'Expected EVENT_JOB_PROGRESS emit count %s to be %s');
			expect(spyProgressReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_PROGRESS re-emit count %s to be %s');
			expect(trackedJob.progress).toBeA(Object, 'Expected arguments[0] type %s to be an object');
			expect(Object.keys(trackedJob.progress)).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
			expect(trackedJob.progress).toEqual(progressObjCleaned, 'Expected arguments[0] %s to equal %s');
		});
	});

	it('should emit EVENT_JOB_PROGRESS for run', function() {
		var progressObj = {};
		var manager = createManagerFixture();
		var resolveCb;
		var sendProgressCb;

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			function() {
				sendProgressCb = arguments[0];
				resolveCb = arguments[1];
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
			sendProgressCb(progressObj);
			resolveCb();
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
			expect(this).toBe(emitter, 'Expected re-emit EVENT_JOB_PROGRESS context %s to be emitter');
			expect(arguments.length).toBe(2, 'Expected re-emit EVENT_JOB_PROGRESS arguments count %s to be %s');
			expect(arguments[0]).toBe(trackedJob, 'Expected re-emit EVENT_JOB_PROGRESS arguments[0] %s to be trackedJob');
			expect(arguments[1]).toBe(progressObj, 'Expected re-emit EVENT_JOB_PROGRESS arguments[1] type %s to be TrackedJob#progress');
		});
		emitter.on(constants.EVENT_JOB_PROGRESS, spyProgressReEmit);

		return trackedJob.run()
			.then(function() {
				expect(spyJobProgressEvent.calls.length).toBe(1, 'Expected EVENT_JOB_FORKED emit count %s to be %s');
				expect(spyProgressReEmit.calls.length).toBe(1, 'Expected EVENT_JOB_FORKED re-emit count %s to be %s');
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
		});
	});
});
