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
var JobForkObserver = require('../../lib/JobForkObserver');

describe('TrackedJob', function() {
	var badWorkerPath = path.join(__dirname, '..', 'fixtures', 'bad-worker.js');

	function createManagerFixture(overrides) {
		overrides = overrides || {};
		return {
			options: Object.assign({
				forkModulePath: badWorkerPath,
				workerStartupTimeout: 1
			}, overrides.options || {}),
			validateJobParams: overrides.validateJobParams || function() {},
			middleware: new MiddlewareStore()
				.addSupportedSyncTypes([
					constants.MIDDLEWARE_FORK_JOB_PROCESS,
					constants.MIDDLEWARE_BUILD_FORK_ARGS,
					constants.MIDDLEWARE_BUILD_FORK_OPTS,
					constants.MIDDLEWARE_OBSERVE_WORKER_PROCESS
				])
		};
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
		expect(trackedJob.manager).toBe(manager, 'Expected manager prop %s to be %s');
		expect(trackedJob.jobId).toBe('FOO', 'Expected jobId prop %s to be %s');
		expect(trackedJob.jobConfig).toBe(jobConfig, 'Expected jobConfig prop %s to be %s');
		expect(trackedJob.params).toBe(params, 'Expected params prop %s to be %s');
		expect(trackedJob.isRunning).toBe(false, 'Expected isRunning prop %s to be %s');
		expect(trackedJob.promise).toBe(null, 'Expected promise prop %s to be %s');
		expect(trackedJob.childProcess).toBe(null, 'Expected childProcess prop %s to be %s');
		expect(trackedJob instanceof EventEmitter).toBe(true, 'Expected trackedJob to be instance of EventEmitter');
	});

	it('should return a rejected promise from TrackedJob#then if not yet started', function() {
		var trackedJob = new TrackedJob({}, 'FOO', {}, {});
		expect(trackedJob.promise).toBe(null);
		return trackedJob.then(function() {
			throw new Error('Expected to not resolve successfully');
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

	it('should emit EVENT_JOB_STARTED', function(done) {
		var manager = createManagerFixture({
			validateJobParams: function() {
				throw new Error();
			}
		});
		var trackedJob = new TrackedJob(manager, 'FOO', { run: function() {} }, {});
		trackedJob.on(constants.EVENT_JOB_STARTED, function() {
			try {
				expect(trackedJob.isRunning).toBe(true);
				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(0, 'Expected arguments count %s to be %s');
				done();
			}
			catch (err) {
				done(err);
			}
		});
		trackedJob.run();
	});

	it('should re-emit EVENT_JOB_STARTED', function(done) {
		var manager = createManagerFixture({
			validateJobParams: function() {
				throw new Error();
			}
		});

		var emitter = new EventEmitter();
		emitter.on(constants.EVENT_JOB_STARTED, function() {
			try {
				expect(trackedJob.isRunning).toBe(true);
				expect(this).toBe(emitter, 'Expected context %s to be emitter');
				expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
				done();
			}
			catch (err) {
				done(err);
			}
		});

		var trackedJob = new TrackedJob(manager, 'FOO', { run: function() {} }, {});
		trackedJob.reEmitTo(emitter);
		trackedJob.run();
	});

	it('should validate the job params', function() {
		var paramError = new errors.InvalidJobParamError('nope!', 'foo', void 0);
		var manager = createManagerFixture({
			validateJobParams: expect.createSpy()
				.andCall(function() {
					expect(trackedJob.stage).toBe(constants.JOB_STAGE_VALIDATE_PARAMS, 'Expected TrackedJob stage %s to be %s');
					throw paramError;
				})
		});
		var jobConfig = {
			quickRun: function() {
				throw new Error('Expected jobConfig.quickRun to not be called');
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var params = {};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);
		expect(trackedJob.isRunning).toBe(false, 'Expected trackedJob.isRunning %s to be %s');
		expect(trackedJob.run()).toBe(trackedJob, 'Expected return of trackedJob.run() %s to be trackedJob (i.e. this)');
		expect(trackedJob.isRunning).toBe(true, 'Expected trackedJob.isRunning %s to now be %s');
		expect(trackedJob.promise).toBeA(Promise, 'Expected trackedJob.promise %s to be a Promise');

		var promise = trackedJob.promise;
		trackedJob.run();
		expect(trackedJob.promise).toBe(promise, 'Expected trackedJob.promise %s to still be same instance');

		return trackedJob.then(function() {
			throw new Error('Expected to not resolve successfully');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== paramError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false);
			expect(manager.validateJobParams.calls.length).toBe(1, 'Expected validateJobParams call count %s to be %s');
			expect(manager.validateJobParams.calls[0].context).toBe(manager, 'Expected validateJobParams context %s to be manager');
			expect(manager.validateJobParams.calls[0].arguments.length).toBe(2, 'Expected validateJobParams arguments length %s to be %s');
			expect(manager.validateJobParams.calls[0].arguments[0]).toBe(jobConfig, 'Expected validateJobParams arguments[0] %s to be jobConfig');
			expect(manager.validateJobParams.calls[0].arguments[1]).toBe(params, 'Expected validateJobParams arguments[1] %s to be params');
		});
	});

	it('should call quickRun and allow it to resolve', function() {
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
			quickRun: function(job, next) {
				expect(trackedJob.stage).toBe(constants.JOB_STAGE_QUICK_RUN, 'Expected TrackedJob stage %s to be %s');
				expect(job).toBeA(Object, 'Expected quickRun job arg type of %s to be an object');
				expect(job.jobId).toBe('FOO', 'Expected quickRun job.jobId %s to be %s');
				expect(job.params).toBeA(Object, 'Expected quickRun job.params type %s to be an object');
				expect(Object.keys(job.params)).toEqual(Object.keys(paramsCleaned), 'Expected quickRun job.params keys %s to equal %s');
				expect(job.params).toEqual(paramsCleaned, 'Expected quickRun job.params %s to equal %s');
				expect(job.resolve).toBeA(Function, 'Expected quickRun job.resolve of %s to be a function');
				expect(job.reject).toBeA(Function, 'Expected quickRun job.reject %s to be a function');
				expect(job.sendProgress).toBeA(Function, 'Expected quickRun job.sendProgress %s to be a function');
				expect(next).toBeA(Function, 'Expected quickRun next %s to be a function');
				job.resolve(5);
			},
			run: function() {
				throw new Error('Expected jobConfig.run to not be called');
			}
		};

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, params);
		expect(trackedJob.isRunning).toBe(false, 'Expected trackedJob.isRunning %s to be %s');
		expect(trackedJob.run()).toBe(trackedJob, 'Expected trackedJob.run() return %s to be "this"');
		expect(trackedJob.isRunning).toBe(true, 'Expected trackedJob.isRunning %s to now be %s');
		expect(trackedJob.promise).toBeA(Promise, 'Expected trackedJob.promise %s to be a Promise');

		var promise = trackedJob.promise;
		trackedJob.run();
		expect(trackedJob.promise).toBe(promise, 'Expected trackedJob.promise to be same promise instance after re-calling trackedJob.run');

		return trackedJob.promise.then(function(val) {
			expect(trackedJob.isRunning).toBe(false);
			expect(val).toBe(5);
		}, function(err) {
			err.message = 'Expected catch to not be called -- Error:' + err.message;
			throw err;
		});
	});

	it('should allow quickRun to reject', function() {
		var quickRunError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				job.reject(quickRunError);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		return trackedJob.run().then(function() {
			throw new Error('Expected to not resolve successfully');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== quickRunError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false);
		});
	});

	it('should reject if quickRun throws synchronously', function() {
		var quickRunError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				throw quickRunError;
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		return trackedJob.run().then(function() {
			throw new Error('Expected to not resolve successfully');
		}, function(err) {
			// Rethrow error if not the expected one
			if (err !== quickRunError) {
				throw err;
			}

			expect(trackedJob.isRunning).toBe(false);
		});
	});

	it('should call jobConfig.onFailure', function() {
		var expectedError = new Error();
		var manager = createManagerFixture();
		var jobConfig = {
			onFailure: expect.createSpy().andCall(function() {
				expect(trackedJob.isRunning).toBe(false);
				expect(this).toBe(jobConfig, 'Expected context %s to be jobConfig');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be thrown error');
				expect(arguments[1]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
			}),
			quickRun: function() {
				throw expectedError;
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		return trackedJob.run()
			.then(function() {
				throw new Error('Expected to not resolve successfully');
			}, function(err) {
				// Rethrow error if not the expected one
				if (err !== expectedError) {
					throw err;
				}

				expect(jobConfig.onFailure.calls.length).toBe(1, 'Expected onFailure call count %s to be %s');
			});
	});

	it('should emit EVENT_JOB_FAILURE', function(done) {
		var valErr = new Error('FOO');
		var manager = createManagerFixture({
			validateJobParams: function() {
				throw valErr;
			}
		});
		var trackedJob = new TrackedJob(manager, 'FOO', { run: function() {} }, {});
		trackedJob.on(constants.EVENT_JOB_FAILURE, function() {
			try {
				expect(trackedJob.isRunning).toBe(false);
				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(valErr, 'Expected arguments[0] %s to be thrown error');
				done();
			}
			catch (err) {
				done(err);
			}
		});
		trackedJob.run();
	});

	it('should re-emit EVENT_JOB_FAILURE', function(done) {
		var valErr = new Error('FOO');
		var manager = createManagerFixture({
			validateJobParams: function() {
				throw valErr;
			}
		});

		var emitter = new EventEmitter();
		emitter.on(constants.EVENT_JOB_FAILURE, function() {
			try {
				expect(this).toBe(emitter, 'Expected context %s to be emitter');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
				expect(arguments[1]).toBe(valErr, 'Expected arguments[0] %s to be thrown error');
				done();
			}
			catch (err) {
				done(err);
			}
		});

		var trackedJob = new TrackedJob(manager, 'FOO', { run: function() {} }, {});
		trackedJob.reEmitTo(emitter);
		trackedJob.run();
	});

	it('should call jobConfig.onSuccess for quickRun', function() {
		var manager = createManagerFixture();
		var jobConfig = {
			onSuccess: expect.createSpy().andCall(function() {
				expect(trackedJob.isRunning).toBe(false);
				expect(this).toBe(jobConfig, 'Expected context %s to be jobConfig');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(500, 'Expected arguments[0] %s to be %s');
				expect(arguments[1]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
			}),
			quickRun: function(job) {
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		return trackedJob.run()
			.then(function() {
				expect(jobConfig.onSuccess.calls.length).toBe(1, 'Expected onSuccess call count %s to be %s');
			});
	});

	it('should emit EVENT_JOB_SUCCESS for quickRun', function(done) {
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		trackedJob.on(constants.EVENT_JOB_SUCCESS, function() {
			try {
				expect(trackedJob.isRunning).toBe(false);
				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(500, 'Expected arguments[0] %s to be %s');
				done();
			}
			catch (err) {
				done(err);
			}
		});
		trackedJob.run();
	});

	it('should re-emit EVENT_JOB_SUCCESS', function(done) {
		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};

		var emitter = new EventEmitter();
		emitter.on(constants.EVENT_JOB_SUCCESS, function() {
			try {
				expect(this).toBe(emitter, 'Expected context %s to be emitter');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
				expect(arguments[1]).toBe(500, 'Expected arguments[1] %s to be %s');
				done();
			}
			catch (err) {
				done(err);
			}
		});

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		trackedJob.reEmitTo(emitter);
		trackedJob.run();
	});

	it('should emit EVENT_JOB_SUCCESS for run');
	it('should re-emit EVENT_JOB_SUCCESS for run');

	it('should call jobConfig.onProgress for quickRun', function() {
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
			func: function(){},
			obj: {},
			regex: /^$/
		};

		var progressObjCleaned = JSON.parse(JSON.stringify(progressObj));

		var manager = createManagerFixture();
		var jobConfig = {
			onProgress: expect.createSpy().andCall(function() {
				expect(trackedJob.isRunning).toBe(true);
				expect(this).toBe(jobConfig, 'Expected context %s to be jobConfig');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBeA(Object, 'Expected arguments[0] type %s to be an object');
				expect(Object.keys(arguments[0])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
				expect(arguments[0]).toEqual(progressObjCleaned, 'Expected arguments[0] %s to equal %s');
				expect(arguments[0]).toBe(trackedJob.progress, 'Expected arguments[0] %s to be TrackedJob#progress');
				expect(arguments[1]).toBe(trackedJob, 'Expected arguments[1] %s to be TrackedJob');
			}),
			quickRun: function(job) {
				job.sendProgress(progressObj);
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		return trackedJob.run()
			.then(function() {
				expect(jobConfig.onProgress.calls.length).toBe(1, 'Expected onProgress call count %s to be %s');
			});
	});

	it('should emit EVENT_JOB_PROGRESS for quickRun', function(done) {
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
			func: function(){},
			obj: {},
			regex: /^$/
		};

		var progressObjCleaned = JSON.parse(JSON.stringify(progressObj));

		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				job.sendProgress(progressObj);
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};
		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		trackedJob.on(constants.EVENT_JOB_PROGRESS, function() {
			try {
				expect(trackedJob.isRunning).toBe(true);
				expect(this).toBe(trackedJob, 'Expected context %s to be trackedJob');
				expect(arguments.length).toBe(1, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBeA(Object, 'Expected arguments[0] type %s to be an object');
				expect(Object.keys(arguments[0])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[0] keys %s to equal %s');
				expect(arguments[0]).toEqual(progressObjCleaned, 'Expected arguments[0] %s to equal %s');
				expect(arguments[0]).toBe(trackedJob.progress, 'Expected arguments[0] %s to be TrackedJob#progress');
				done();
			}
			catch (err) {
				done(err);
			}
		});
		trackedJob.run();
	});

	it('should re-emit EVENT_JOB_PROGRESS for quickRun', function(done) {
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
			func: function(){},
			obj: {},
			regex: /^$/
		};

		var progressObjCleaned = JSON.parse(JSON.stringify(progressObj));

		var manager = createManagerFixture();
		var jobConfig = {
			quickRun: function(job) {
				job.sendProgress(progressObj);
				job.resolve(500);
			},
			run: function() {
				throw new Error('Expected jobCofig.run to not be called');
			}
		};

		var emitter = new EventEmitter();
		emitter.on(constants.EVENT_JOB_PROGRESS, function() {
			try {
				expect(this).toBe(emitter, 'Expected context %s to be emitter');
				expect(arguments.length).toBe(2, 'Expected arguments count %s to be %s');
				expect(arguments[0]).toBe(trackedJob, 'Expected arguments[0] %s to be trackedJob');
				expect(arguments[1]).toBeA(Object, 'Expected arguments[1] type %s to be an object');
				expect(Object.keys(arguments[1])).toEqual(Object.keys(progressObjCleaned), 'Expected arguments[1] keys %s to equal %s');
				expect(arguments[1]).toEqual(progressObjCleaned, 'Expected arguments[1] %s to equal %s');
				done();
			}
			catch (err) {
				done(err);
			}
		});

		var trackedJob = new TrackedJob(manager, 'FOO', jobConfig, {});
		trackedJob.reEmitTo(emitter);
		trackedJob.run();
	});

	it('should allow middleware to intercept starting child process: build args/opts, forking, and observing', function() {
		var manager = createManagerFixture();

		var observeError = new Error();

		var middlewareArgs = [
			'--useIPC',
			'--fakeOpt'
		];

		var middlewareOpts = {
			'--fake-something': true
		};

		var childProcess;

		var spyArgs = expect.createSpy()
			.andCall(function() {
				expect(spyArgs.calls.length).toBe(1);
				expect(spyOpts.calls.length).toBe(0);
				expect(spyFork.calls.length).toBe(0);
				expect(spyObserve.calls.length).toBe(0);

				expect(this).toBe(trackedJob);
				expect(arguments.length).toBe(2);
				expect(arguments[0]).toBe(trackedJob); // trackedJob
				expect(arguments[1]).toBeA(Function);

				// Check what would have been returned if not intercepted
				var origRet = arguments[1](); // Next
				expect(origRet).toBeA(Array);
				expect(origRet.length).toBe(3);
				expect(origRet).toEqual([
					'--useIPC',
					'--jobName=FOO',
					'--jobId=BAR'
				]);

				return middlewareArgs;
			});

		var spyOpts = expect.createSpy()
			.andCall(function() {
				expect(spyArgs.calls.length).toBe(1);
				expect(spyOpts.calls.length).toBe(1);
				expect(spyFork.calls.length).toBe(0);
				expect(spyObserve.calls.length).toBe(0);

				expect(this).toBe(trackedJob);
				expect(arguments.length).toBe(2);
				expect(arguments[0]).toBe(trackedJob); // trackedJob
				expect(arguments[1]).toBeA(Function);

				// Check what would have been returned if not intercepted
				var origRet = arguments[1](); // Next
				expect(origRet).toBeA(Object);
				expect(Object.keys(origRet).length).toBe(0);

				return middlewareOpts;
			});

		var spyFork = expect.createSpy()
			.andCall(function() {
				expect(spyArgs.calls.length).toBe(1);
				expect(spyOpts.calls.length).toBe(1);
				expect(spyFork.calls.length).toBe(1);
				expect(spyObserve.calls.length).toBe(0);

				expect(this).toBe(trackedJob);
				expect(arguments.length).toBe(4);
				expect(arguments[0]).toBe(badWorkerPath);
				expect(arguments[1]).toBe(middlewareArgs);
				expect(arguments[2]).toBe(middlewareOpts);
				expect(arguments[3]).toBeA(Function);

				// Check what would have been returned if not intercepted
				var origRet = arguments[3](); // Next
				expect(origRet).toBeA(ChildProcess);

				return childProcess = createChildProcessFixture();
			});

		var spyObserve = expect.createSpy()
			.andCall(function() {
				expect(spyArgs.calls.length).toBe(1);
				expect(spyOpts.calls.length).toBe(1);
				expect(spyFork.calls.length).toBe(1);
				expect(spyObserve.calls.length).toBe(1);

				expect(this).toBe(trackedJob);
				expect(arguments.length).toBe(4);
				expect(arguments[0]).toBeA(Function);
				expect(arguments[1]).toBeA(Function);
				expect(arguments[2]).toBeA(Function);
				expect(arguments[3]).toBeA(Function);

				// Check what would have been returned if not intercepted
				var origRet = arguments[3](); // Next
				expect(origRet).toBeA(JobForkObserver);

				throw observeError;
			});

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_BUILD_FORK_ARGS,
			spyArgs
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_BUILD_FORK_OPTS,
			spyOpts
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_FORK_JOB_PROCESS,
			spyFork
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_OBSERVE_WORKER_PROCESS,
			spyObserve
		);

		var jobConfig = {
			jobName: 'FOO',
			run: function() {
				throw new Error('Expected to not call jobConfig.run');
			}
		};

		var trackedJob = new TrackedJob(manager, 'BAR', jobConfig, {});
		return trackedJob.run()
			.then(function() {
				throw new Error('Expected to not resolve successfully');
			}, function(err) {
				// Rethrow error if not the expected one
				if (err !== observeError) {
					throw err;
				}

				expect(spyOpts.calls.length).toBe(1);
				expect(spyArgs.calls.length).toBe(1);
				expect(spyFork.calls.length).toBe(1);
				expect(spyObserve.calls.length).toBe(1);
				expect(trackedJob.childProcess).toBe(childProcess);
			});
	});

	it('should call jobConfig.onProgress for run');
	it('should emit EVENT_JOB_PROGRESS for run');
	it('should re-emit EVENT_JOB_PROGRESS for run');

	it('should emit EVENT_JOB_FORKED for run');
	it('should re-emit EVENT_JOB_FORKED for run');
});
