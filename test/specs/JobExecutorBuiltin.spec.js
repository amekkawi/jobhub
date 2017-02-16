var EventEmitter = require('events').EventEmitter;
var expect = require('expect');
var constants = require('../../lib/constants');
var errors = require('../../lib/errors');
var JobExecutor = require('../../lib/JobExecutor');
var JobExecutorBuiltin = require('../../lib/JobExecutorBuiltin');

describe('JobExecutorBuiltin', function() {
	function createTrackedJobFixture(proto) {
		return Object.assign(new EventEmitter(), {
			run: expect.createSpy()
		}, proto);
	}

	it('should returns defaults from JobExecutorBuiltin.getDefaultOptions', function() {
		expect(JobExecutorBuiltin.getDefaultOptions).toBeA(Function);
		var options = JobExecutorBuiltin.getDefaultOptions();
		expect(Object.keys(options)).toEqual(['maxConcurrent']);
		expect(options.maxConcurrent).toBe(0);
	});

	it('should set properties from constructor', function() {
		var options = JobExecutorBuiltin.getDefaultOptions();
		var manager = {};
		var executor = new JobExecutorBuiltin(options, manager);
		expect(executor).toBeA(JobExecutor, 'Expected JobExecutorBuiltin#options %s to be a %s');
		expect(executor.options).toBe(options, 'Expected JobExecutorBuiltin#options %s to be %s');
		expect(executor.manager).toBe(manager, 'Expected JobExecutorBuiltin#manager %s to be %s');
	});

	it('should return counts via JobExecutorBuiltin#getStatus', function() {
		var executor = new JobExecutorBuiltin({
			maxConcurrent: 10
		}, {});
		var status = executor.getStatus();
		expect(status).toBeA(Object);
		expect(Object.keys(status)).toEqual(['maxConcurrent', 'queuedCount', 'runningCount']);
		expect(status.maxConcurrent).toBe(10);
		expect(status.queuedCount).toBe(0);
		expect(status.runningCount).toBe(0);
	});

	it('should add jobs to queue and run up to capacity', function() {
		var executor = new JobExecutorBuiltin({
			maxConcurrent: 2
		}, {});

		var runSpy = expect.createSpy();

		executor.add(createTrackedJobFixture({
			run: runSpy
		}));
		executor.add(createTrackedJobFixture({
			run: runSpy
		}));
		executor.add(createTrackedJobFixture({
			run: runSpy
		}));

		var status = executor.getStatus();
		expect(status.queuedCount).toBe(3);
		expect(status.runningCount).toBe(0);
		expect(runSpy.calls.length).toBe(0);

		return new Promise(function(resolve) {
			setImmediate(resolve);
		}).then(function() {
			var status = executor.getStatus();
			expect(status.queuedCount).toBe(1);
			expect(status.runningCount).toBe(2);
			expect(runSpy.calls.length).toBe(2);
		});
	});

	it('should run queued jobs as capacity becomes available', function() {
		var executor = new JobExecutorBuiltin({
			maxConcurrent: 2
		}, {});

		var resolveOuter;

		var trackedJobA = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				expect(trackedJobA.run.calls.length).toBe(1);
				expect(trackedJobB.run.calls.length).toBe(0);
				expect(trackedJobC.run.calls.length).toBe(0);
				expect(trackedJobD.run.calls.length).toBe(0);

				var status = executor.getStatus();
				expect(status.queuedCount).toBe(3);
				expect(status.runningCount).toBe(1);

				this.promise = new Promise(function(resolve) {
					setImmediate(function() {
						this.emit(constants.EVENT_JOB_SUCCESS, {});
						resolve({});
					}.bind(this));
				}.bind(this));
				return this;
			})
		});

		var trackedJobB = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				expect(trackedJobA.run.calls.length).toBe(1);
				expect(trackedJobB.run.calls.length).toBe(1);
				expect(trackedJobC.run.calls.length).toBe(0);
				expect(trackedJobD.run.calls.length).toBe(0);

				var status = executor.getStatus();
				expect(status.queuedCount).toBe(2);
				expect(status.runningCount).toBe(2);

				this.promise = new Promise(function(resolve, reject) {
					setImmediate(function() {
						this.emit(constants.EVENT_JOB_FAILURE, new Error());
						reject(new Error());
					}.bind(this));
				}.bind(this));

				// Catch to avoid unhandled rejection errors
				this.promise.catch(function() {});

				return this;
			})
		});

		var trackedJobC = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				expect(trackedJobA.run.calls.length).toBe(1);
				expect(trackedJobB.run.calls.length).toBe(1);
				expect(trackedJobC.run.calls.length).toBe(1);
				expect(trackedJobD.run.calls.length).toBe(0);

				var status = executor.getStatus();
				expect(status.queuedCount).toBe(1);
				expect(status.runningCount).toBe(1);

				this.promise = new Promise(function(resolve) {
					setImmediate(function() {
						this.emit(constants.EVENT_JOB_SUCCESS, {});
						resolve({});

						setImmediate(resolveOuter);
					}.bind(this));
				}.bind(this));
				return this;
			})
		});

		var trackedJobD = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				expect(trackedJobA.run.calls.length).toBe(1);
				expect(trackedJobB.run.calls.length).toBe(1);
				expect(trackedJobC.run.calls.length).toBe(1);
				expect(trackedJobD.run.calls.length).toBe(1);

				var status = executor.getStatus();
				expect(status.queuedCount).toBe(0);
				expect(status.runningCount).toBe(2);

				this.promise = new Promise(function(resolve) {
					setImmediate(function() {
						this.emit(constants.EVENT_JOB_SUCCESS, {});
						resolve({});

						setImmediate(resolveOuter);
					}.bind(this));
				}.bind(this));
				return this;
			})
		});

		executor.add(trackedJobA);
		executor.add(trackedJobB);
		executor.add(trackedJobC);
		executor.add(trackedJobD);

		expect(trackedJobA.run.calls.length).toBe(0);
		expect(trackedJobB.run.calls.length).toBe(0);
		expect(trackedJobC.run.calls.length).toBe(0);
		expect(trackedJobD.run.calls.length).toBe(0);

		var status = executor.getStatus();
		expect(status.queuedCount).toBe(4);
		expect(status.runningCount).toBe(0);

		return new Promise(function(resolve) {
			resolveOuter = resolve;
		}).then(function() {
			expect(trackedJobA.run.calls.length).toBe(1);
			expect(trackedJobB.run.calls.length).toBe(1);
			expect(trackedJobC.run.calls.length).toBe(1);
			expect(trackedJobD.run.calls.length).toBe(1);

			var status = executor.getStatus();
			expect(status.queuedCount).toBe(0);
			expect(status.runningCount).toBe(0);
		});
	});

	it('should skip already running jobs once reached in the queue', function() {
		var executor = new JobExecutorBuiltin({
			maxConcurrent: 2
		}, {});

		var resolveOuter;

		var trackedJobA = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				var status = executor.getStatus();
				expect(status.queuedCount).toBe(2);
				expect(status.runningCount).toBe(1);

				this.promise = new Promise(function(resolve) {
					setImmediate(function() {
						this.emit(constants.EVENT_JOB_SUCCESS, {});
						resolve({});

						setImmediate(resolveOuter);
					}.bind(this));
				}.bind(this));
				return this;
			})
		});

		var trackedJobB = createTrackedJobFixture({
			promise: Promise.resolve(),
			run: expect.createSpy().andCall(function() {
				throw new Error('Expected to not be called');
			})
		});

		var trackedJobC = createTrackedJobFixture({
			run: expect.createSpy().andCall(function() {
				expect(trackedJobC.run.calls.length).toBe(1);
				this.promise = Promise.resolve();
				return this;
			})
		});

		executor.add(trackedJobA);
		executor.add(trackedJobB);
		executor.add(trackedJobC);

		expect(trackedJobA.run.calls.length).toBe(0);
		expect(trackedJobB.run.calls.length).toBe(0);
		expect(trackedJobC.run.calls.length).toBe(0);

		trackedJobC.run();

		var status = executor.getStatus();
		expect(status.queuedCount).toBe(3);
		expect(status.runningCount).toBe(0);

		return new Promise(function(resolve) {
			resolveOuter = resolve;
		}).then(function() {
			expect(trackedJobA.run.calls.length).toBe(1);
			expect(trackedJobC.run.calls.length).toBe(1);

			var status = executor.getStatus();
			expect(status.queuedCount).toBe(0);
			expect(status.runningCount).toBe(0);
		});
	});

	describe('JobExecutorBuiltin.parseOptions', function() {
		it('should normalize the props', function() {
			var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
			var parsed = JobExecutorBuiltin.parseOptions({}, defaultOptions);
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed).sort()).toEqual(Object.keys(defaultOptions).sort());
			expect(parsed.maxConcurrent).toBe(0);
		});

		it('should omit props not in the defaults', function() {
			var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
			var parsed = JobExecutorBuiltin.parseOptions({
				someOtherProp: {}
			}, defaultOptions);
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed).sort()).toEqual(Object.keys(defaultOptions).sort());
		});

		it('should throw a InvalidManagerOptionsError if "maxConcurrent" is not a finite number', function() {
			expect(function() {
				var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
				JobExecutorBuiltin.parseOptions({
					maxConcurrent: false
				}, defaultOptions);
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorOptions.maxConcurrent'
			});
			expect(function() {
				var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
				JobExecutorBuiltin.parseOptions({
					maxConcurrent: null
				}, defaultOptions);
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorOptions.maxConcurrent'
			});
			expect(function() {
				var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
				JobExecutorBuiltin.parseOptions({
					maxConcurrent: {}
				}, defaultOptions);
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorOptions.maxConcurrent'
			});
			expect(function() {
				var defaultOptions = JobExecutorBuiltin.getDefaultOptions();
				JobExecutorBuiltin.parseOptions({
					maxConcurrent: Infinity
				}, defaultOptions);
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorOptions.maxConcurrent'
			});
		});

		it('should normalize "maxConcurrent" so it is no less than 0', function() {
			var parsedA = JobExecutorBuiltin.parseOptions({
				maxConcurrent: -10
			}, JobExecutorBuiltin.getDefaultOptions());
			expect(parsedA.maxConcurrent).toBe(0);

			var parsedB = JobExecutorBuiltin.parseOptions({
				maxConcurrent: 10
			}, JobExecutorBuiltin.getDefaultOptions());
			expect(parsedB.maxConcurrent).toBe(10);
		});
	});
});
