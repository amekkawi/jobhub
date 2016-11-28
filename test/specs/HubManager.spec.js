var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var util = require('../../lib/util');
var HubManager = require('../../lib/HubManager');
var MiddlewareStore = require('../../lib/MiddlewareStore');
var JobConfigStore = require('../../lib/JobConfigStore');
var TrackedJob = require('../../lib/TrackedJob');

describe('HubManager', function() {
	var jobsFixturePath = path.resolve(__dirname, '../fixtures/jobs.js');

	it('should throw InvalidManagerOptionsError if options not provided or missing options.jobsModulePath', function() {
		var thrownError;

		try {
			new HubManager();
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.InvalidManagerOptionsError);
		expect(thrownError.propName).toBe('jobsModulePath');

		try {
			new HubManager({});
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.InvalidManagerOptionsError);
		expect(thrownError.propName).toBe('jobsModulePath');
	});

	it('should set properties and extend from EventEmitter', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		expect(manager instanceof EventEmitter).toBe(true, 'Expected HubManager to be instance of EventEmitter');
		expect(manager.options).toBeA(Object, 'Expected HubManager#options %s to be a object');
		expect(manager.options.jobsModulePath).toBe(options.jobsModulePath, 'Expected HubManager#options.jobsModulePath %s to be %s');

		var defaultOptions = util.getDefaultManagerOptions();
		Object.keys(defaultOptions).forEach(function(key) {
			if (key !== 'jobsModulePath') {
				expect(manager.options[key]).toBe(defaultOptions[key], 'Expected HubManager#options.' + key + ' %s to be %s');
			}
		});

		expect(manager.middleware).toBeA(MiddlewareStore, 'Expected HubManager#middleware %s to be a %s');
		expect(manager.middleware.getSupportedSyncTypes()).toEqual(manager.getSupportedSyncMiddleware(), 'Expected supported sync middleware %s to equal %s');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_LOAD_JOBS)).toBe(true, 'Expected middleware support for "loadJobs"');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_CREATE_JOB)).toBe(true, 'Expected middleware support for "createJob"');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_FORK_JOB_PROCESS)).toBe(true, 'Expected middleware support for "forkJobProcess"');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_BUILD_FORK_ARGS)).toBe(true, 'Expected middleware support for "buildForkArgs"');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_BUILD_FORK_OPTS)).toBe(true, 'Expected middleware support for "buildForkOpts"');
		expect(manager.middleware.hasSyncSupport(constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR)).toBe(true, 'Expected middleware support for "createWorkerMediator"');
		expect(manager.jobs).toBeA(JobConfigStore, 'Expected HubManager#jobs %s to be a %s');
	});

	it('should allow overriding built-in supported middleware', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var ExtManager = function() {
			HubManager.apply(this, arguments);
		};

		inherits(ExtManager, HubManager);

		ExtManager.prototype.getSupportedSyncMiddleware = function() {
			return [ 'FOO' ];
		};

		var manager = new ExtManager(options);
		expect(manager.middleware.getSupportedSyncTypes()).toEqual(['FOO']);
	});

	it('should load jobs using "loadJobs" middleware and emit "managerStarted" when HubManager#start is called', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		var spyStartedEvent = expect.createSpy().andCall(function() {
			expect(spyLoadJobsMiddleware.calls.length).toBe(1);
			expect(arguments.length).toBe(0);
		});
		manager.on(constants.EVENT_MANAGER_STARTED, spyStartedEvent);

		var spyLoadJobsMiddleware = expect.createSpy().andCall(function() {
			expect(spyStartedEvent.calls.length).toBe(0);

			expect(this).toBe(manager);
			expect(arguments.length).toBe(2);
			expect(arguments[0]).toBe(manager.jobs);
			expect(arguments[1]).toBeA(Function);

			expect.spyOn(manager.jobs, 'registerJobs').andCall(function() {
				expect(arguments.length).toBe(1);
				expect(arguments[0]).toBe(require(manager.options.jobsModulePath));
			});

			expect(manager.jobs.registerJobs.calls.length).toBe(0);
			var origRet = arguments[1](); // Next
			expect(manager.jobs.registerJobs.calls.length).toBe(1);
			return origRet;
		});

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			spyLoadJobsMiddleware
		);

		manager.start();
		expect(spyLoadJobsMiddleware.calls.length).toBe(1);
	});

	it('should return a unique key from getUniqueKey', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJobs({
					notUnique: {
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					isGloballyUnique: {
						unique: true,
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					keyIsNull: {
						uniqueKey: function() {
							return null;
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					keyIsUndefined: {
						uniqueKey: function() {
							return void 0;
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					generatesUniqueKey: {
						uniqueKey: function(params) {
							return params.key;
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					}
				});
			}
		);

		manager.start();

		expect(manager.getUniqueKey('notUnique', {})).toBe(null);
		expect(manager.getUniqueKey('isGloballyUnique', {})).toBe(constants.UNIQUE_KEY);
		expect(manager.getUniqueKey('keyIsNull', {})).toBe(null);
		expect(manager.getUniqueKey('keyIsUndefined', {})).toBe(null);
		expect(manager.getUniqueKey('generatesUniqueKey', { key: 'BAR' })).toBe('BAR');
	});

	it('should throw JobNotFoundError from getUniqueKey for job name not registered', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);
		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				// Register no jobs
			}
		);
		manager.start();

		var thrownError;
		try {
			manager.getUniqueKey('foo', {});
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.JobNotFoundError, 'Expected %s to  be a JobNotFoundError');
		expect(thrownError.jobName).toBe('foo', 'Expected JobNotFoundError#jobName %s to be %s');
	});

	it('should throw InvalidUniqueKeyError for invalid unique keys', function() {
		var expectedInvalidKey = {};
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);
		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					uniqueKey: function(params) {
						return expectedInvalidKey;
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);
		manager.start();

		var thrownError;
		try {
			manager.getUniqueKey('foo', {});
		}
		catch (err) {
			thrownError = err;
		}

		expect(thrownError).toBeA(errors.InvalidUniqueKeyError, 'Expected %s to  be a InvalidUniqueKeyError');
		expect(thrownError.jobName).toBe('foo', 'Expected InvalidUniqueKeyError#jobName %s to be %s');
		expect(thrownError.keyValue).toBe(expectedInvalidKey, 'Expected InvalidUniqueKeyError#keyValue %s to be %s');
	});

	it('should validate job params using validateJobParams', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);
		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJobs({
					noValidate: {
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					validateNoop: {
						validate: function() {

						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					validateReturnFalse: {
						validate: function() {
							return false;
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					validateInvalid: {
						validate: function(params, InvalidJobParamError) {
							throw new InvalidJobParamError('IS_BAD', 'badParam', 'badVal');
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					},
					validateInvalidPromise: {
						validate: function(params, InvalidJobParamError) {
							throw new InvalidJobParamError('IS_PROMISE_BAD', 'badPromiseParam', 'badPromiseVal');
						},
						run: function() {
							throw new Error('Expected not to be called');
						}
					}
				})
			}
		);
		manager.start();

		return Promise.resolve()
			.then(function() {
				var promise = manager.validateJobParams('noValidate', {});
				expect(promise).toBeA(Promise);
				return promise.then(function(result) {
					expect(result).toBe(void 0);
				});
			})
			.then(function() {
				var promise = manager.validateJobParams('validateNoop', {});
				expect(promise).toBeA(Promise);
				return promise.then(function(result) {
					expect(result).toBe(void 0);
				});
			})
			.then(function() {
				var promise = manager.validateJobParams('validateReturnFalse', {});
				expect(promise).toBeA(Promise);
				return promise.then(function(result) {
					expect(result).toBe(void 0);
				});
			})
			.then(function() {
				var promise = manager.validateJobParams('validateInvalidPromise', {});
				expect(promise).toBeA(Promise);
				return promise.then(function() {
					throw new Error('Expected not to validate');
				}, function(err) {
					expect(err).toBeA(errors.InvalidJobParamError, 'Expected %s to  be a InvalidJobParamError');
					expect(err.message).toBe('IS_PROMISE_BAD', 'Expected InvalidJobParamError#message %s to be %s');
					expect(err.paramName).toBe('badPromiseParam', 'Expected InvalidJobParamError#paramName %s to be %s');
					expect(err.paramValue).toBe('badPromiseVal', 'Expected InvalidJobParamError#paramValue %s to be %s');
				});
			});
	});

	it('should reject with JobNotFoundError from validateJobParams for job name not registered', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);
		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				// Register no jobs
			}
		);
		manager.start();

		return manager.validateJobParams('foo', {})
			.then(function() {
				throw new Error('Not expected to resolve');
			}, function(err) {
				expect(err).toBeA(errors.JobNotFoundError, 'Expected %s to  be a JobNotFoundError');
				expect(err.jobName).toBe('foo', 'Expected JobNotFoundError#jobName %s to be %s');
			});
	});

	it('should throw JobNotFoundError from queueJob for job name not registered', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);
		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				// Register no jobs
			}
		);
		manager.start();

		var thrownError;

		try {
			manager.queueJob('foo', {});
		}
		catch (err) {
			expect(err).toBeA(errors.JobNotFoundError, 'Expected %s to  be a JobNotFoundError');
			expect(err.jobName).toBe('foo', 'Expected JobNotFoundError#jobName %s to be %s');
		}
	});

	it('should create job using "createJob" middleware', function() {
		var expectedParams = {};

		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		var jobId;
		var trackedJob;

		var createIdOrig = manager.options.createId;
		expect.spyOn(manager.options, 'createId').andCall(function() {
			return jobId = createIdOrig.apply(this, arguments);
		});

		var spyOnCreate = expect.createSpy().andCall(function() {
			expect(trackedJob.reEmitTo.calls.length).toBe(1);
			expect(spyJobCreatedEvent.calls.length).toBe(0);
			expect(trackedJob.run.calls.length).toBe(0);
			expect(arguments.length).toBe(1);
			expect(arguments[0]).toBe(trackedJob);
		});

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					onCreate: spyOnCreate,
					quickRun: function(job) {
						job.resolve(500);
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_JOB,
			function() {
				expect(this).toBe(manager);
				expect(arguments.length).toBe(4);
				expect(arguments[0]).toBe(jobId);
				expect(arguments[1]).toBe(manager.jobs.getJobConfig('foo'));
				expect(arguments[2]).toBe(expectedParams);
				expect(arguments[3]).toBeA(Function);

				trackedJob = arguments[3](); // Next
				expect(trackedJob).toBeA(TrackedJob);
				expect(trackedJob.jobId).toBe(jobId);
				expect(trackedJob.jobConfig).toBe(manager.jobs.getJobConfig('foo'));
				expect(trackedJob.params).toBe(expectedParams);

				expect.spyOn(trackedJob, 'run').andReturn(trackedJob);
				expect.spyOn(trackedJob, 'reEmitTo').andCall(function() {
					expect(spyOnCreate.calls.length).toBe(0);
					return this;
				});

				return trackedJob;
			}
		);

		var spyJobCreatedEvent = expect.createSpy().andCall(function() {
			expect(spyOnCreate.calls.length).toBe(1);
			expect(trackedJob.run.calls.length).toBe(0);
			expect(arguments.length).toBe(1);
			expect(arguments[0]).toBe(trackedJob);
		});
		manager.on(constants.EVENT_JOB_CREATED, spyJobCreatedEvent);

		manager.start();

		var queuedJob = manager.queueJob('foo', expectedParams);
		expect(queuedJob).toBe(trackedJob);

		expect(spyOnCreate.calls.length).toBe(1);
		expect(spyJobCreatedEvent.calls.length).toBe(1);
		expect(trackedJob.reEmitTo.calls.length).toBe(1);
		expect(trackedJob.run.calls.length).toBe(1);
	});

	it('should allow getting running tracked job by ID', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		var trackedJob;

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_JOB,
			function() {
				trackedJob = arguments[3](); // Next
				trackedJob.run = function() {
					this.promise = new Promise(function(){});
					return this;
				};
				return trackedJob;
			}
		);

		manager.start();

		var queuedJob = manager.queueJob('foo', {});
		expect(manager.getTrackedJob(queuedJob.jobId)).toBe(queuedJob);

		var jobs = manager.getTrackedJobs();
		expect(jobs).toBeA(Array);
		expect(jobs.length).toBe(1);
		expect(jobs[0]).toBe(queuedJob);
	});

	it('should support queuing unique jobs', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		var trackedJob;

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					unique: true,
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_JOB,
			function() {
				trackedJob = arguments[3](); // Next
				trackedJob.run = function() {
					this.promise = new Promise(function(){});
					return this;
				};
				return trackedJob;
			}
		);

		manager.start();

		expect(manager.getUniqueKey('foo', {})).toBe(constants.UNIQUE_KEY);
		var queuedJobA = manager.queueJob('foo', {});
		var queuedJobB = manager.queueJob('foo', {});
		expect(queuedJobA).toBe(trackedJob);
		expect(queuedJobA).toBe(queuedJobB);
	});

	it('should support queuing unique jobs by key', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					uniqueKey: function(params) {
						return params.key;
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_JOB,
			function() {
				var trackedJob = arguments[3](); // Next
				trackedJob.run = function() {
					this.promise = new Promise(function(){});
					return this;
				};
				return trackedJob;
			}
		);

		manager.start();

		expect(manager.getUniqueKey('foo', { key: 'A' })).toBe('A');
		expect(manager.getUniqueKey('foo', { key: 'C' })).toBe('C');
		expect(manager.getUniqueKey('foo', { key: null })).toBe(null);

		var queuedJobA = manager.queueJob('foo', { key: 'A' });
		var queuedJobB = manager.queueJob('foo', { key: 'A' });
		var queuedJobC = manager.queueJob('foo', { key: 'C' });
		var queuedJobD = manager.queueJob('foo', { key: null });
		var queuedJobE = manager.queueJob('foo', { key: null });

		expect(queuedJobA).toBeA(TrackedJob);
		expect(queuedJobB).toBeA(TrackedJob);
		expect(queuedJobC).toBeA(TrackedJob);
		expect(queuedJobD).toBeA(TrackedJob);
		expect(queuedJobE).toBeA(TrackedJob);

		expect(queuedJobA).toBe(queuedJobB);
		expect(queuedJobB).toNotBe(queuedJobC);
		expect(queuedJobC).toNotBe(queuedJobD);
		expect(queuedJobD).toNotBe(queuedJobE);
	});

	it('should allow finding tracked job by unique key', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					uniqueKey: function(params) {
						return params.key;
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});

				jobStore.registerJob('bar', {
					unique: true,
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_CREATE_JOB,
			function() {
				var trackedJob = arguments[3](); // Next
				trackedJob.run = function() {
					this.promise = new Promise(function(){});
					return this;
				};
				return trackedJob;
			}
		);

		manager.start();

		expect(manager.findUniqueTrackedJob('notexist')).toBe(null);
		expect(manager.findUniqueTrackedJob('notexist', 'A')).toBe(null);
		expect(manager.findUniqueTrackedJob('notexist', null)).toBe(null);
		expect(manager.findUniqueTrackedJob('notexist', void 0)).toBe(null);

		var queuedJobA = manager.queueJob('foo', { key: 'A' });
		expect(manager.findUniqueTrackedJob('foo', 'A')).toBe(queuedJobA);
		expect(manager.findUniqueTrackedJob('foo')).toBe(null);
		expect(manager.findUniqueTrackedJob('foo', null)).toBe(null);
		expect(manager.findUniqueTrackedJob('foo', void 0)).toBe(null);

		var queuedJobB = manager.queueJob('bar');
		expect(manager.findUniqueTrackedJob('bar')).toBe(queuedJobB);
		expect(manager.findUniqueTrackedJob('bar', null)).toBe(queuedJobB);
		expect(manager.findUniqueTrackedJob('bar', void 0)).toBe(queuedJobB);
		expect(manager.findUniqueTrackedJob('bar', 'A')).toBe(null);
	});

	it('should remove jobs once settled', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					quickRun: function(job) {
						job.resolve(500);
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.start();

		var queuedJob = manager.queueJob('foo', {});
		expect(manager.getTrackedJob(queuedJob.jobId)).toBe(queuedJob);

		return queuedJob.then(function() {
			expect(manager.getTrackedJob(queuedJob.jobId)).toBe(null);
		});
	});

	it('should remove unique jobs once settled', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					uniqueKey: function() {
						return 'uniq';
					},
					quickRun: function(job) {
						job.resolve(500);
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		manager.start();

		var queuedJobA = manager.queueJob('foo', {});
		var queuedJobB = manager.queueJob('foo', {});
		expect(queuedJobA).toBe(queuedJobB);
		expect(manager.findUniqueTrackedJob('foo', 'uniq')).toBe(queuedJobA);

		return queuedJobA.then(function() {
			expect(manager.findUniqueTrackedJob('foo', 'uniq')).toBe(null);
			var queuedJobC = manager.queueJob('foo', {});
			expect(queuedJobA).toNotBe(queuedJobC);
			expect(manager.findUniqueTrackedJob('foo', 'uniq')).toBe(queuedJobC);
		});
	});

	it('should queue jobs for termination once settled', function() {
		var options = {
			jobsModulePath: jobsFixturePath
		};

		var manager = new HubManager(options);

		manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_LOAD_JOBS,
			function(jobStore) {
				jobStore.registerJob('foo', {
					quickRun: function(job) {
						job.resolve(500);
					},
					run: function() {
						throw new Error('Expected not to be called');
					}
				});
			}
		);

		expect.spyOn(manager, 'queueForTermination').andCall(function() {
			expect(arguments.length).toBe(1);
			expect(arguments[0]).toBe(trackedJob);
		});

		var handleSettledJobOrig = manager.handleSettledJob;
		expect.spyOn(manager, 'handleSettledJob').andCall(function() {
			expect(manager.getTrackedJob(trackedJob.jobId)).toBe(trackedJob);
			expect(manager.queueForTermination.calls.length).toBe(0);
			var ret = handleSettledJobOrig.apply(this, arguments);
			expect(manager.getTrackedJob(trackedJob.jobId)).toBe(null);
			expect(manager.queueForTermination.calls.length).toBe(1);
			return ret;
		});

		manager.start();

		var trackedJob = manager.queueJob('foo', {});

		return trackedJob.then(function() {
			expect(manager.handleSettledJob.calls.length).toBe(0);
			expect(manager.queueForTermination.calls.length).toBe(1);
		});
	});

	it('should terminate job worker processes that do not gracefully exit', function() {
		this.slow(450);
		this.timeout(500);

		var options = {
			jobsModulePath: jobsFixturePath,
			terminationSIGTERMTimeout: 30,
			terminationSIGKILLTimeout: 60
		};

		var manager = new HubManager(options).start();

		var terminateSpy;
		var termTime;
		var killTime;

		var trackedJob = manager.queueJob('noGracefulExit');

		var terminateEventSpy = expect.createSpy();
		manager.on(constants.EVENT_JOB_TERMINATE, terminateEventSpy);

		trackedJob.once(constants.EVENT_JOB_FORKED, function() {
			var orig = trackedJob.workerMediator.terminate;
			terminateSpy = expect.spyOn(trackedJob.workerMediator, 'terminate').andCall(function(forceKill) {
				if (forceKill) {
					killTime = Date.now();
					expect(terminateEventSpy.calls.length).toBe(1);
					expect(terminateEventSpy.calls[0].arguments.length).toBe(2);
					expect(terminateEventSpy.calls[0].arguments[0]).toBe(trackedJob);
					expect(terminateEventSpy.calls[0].arguments[1]).toBe(false);
				}
				else {
					termTime = Date.now();
					expect(terminateEventSpy.calls.length).toBe(0);
				}

				return orig.apply(this, arguments);
			});
		});

		return trackedJob.then(function(result) {
			var resolveTime = Date.now();
			expect(result).toBe(600);
			expect(terminateSpy).toExist();
			expect(terminateSpy.calls.length).toBe(0);
			expect(trackedJob.workerMediator.exited).toBe(false);

			return new Promise(function(resolve) {
				trackedJob.workerMediator.once(constants.EVENT_JOB_EXIT, resolve);
			})
				.then(function() {
					expect(termTime).toBeGreaterThan(resolveTime);
					expect(killTime).toBeGreaterThan(resolveTime);
					expect(termTime - resolveTime).toBeGreaterThanOrEqualTo(30 - 2).toBeLessThanOrEqualTo(30 * 2);
					expect(killTime - termTime).toBeGreaterThanOrEqualTo(60 - 2).toBeLessThanOrEqualTo(60 * 2);

					expect(terminateEventSpy.calls.length).toBe(2);
					expect(terminateEventSpy.calls[0].arguments.length).toBe(2);
					expect(terminateEventSpy.calls[0].arguments[0]).toBe(trackedJob);
					expect(terminateEventSpy.calls[0].arguments[1]).toBe(false);
					expect(terminateEventSpy.calls[1].arguments.length).toBe(2);
					expect(terminateEventSpy.calls[1].arguments[0]).toBe(trackedJob);
					expect(terminateEventSpy.calls[1].arguments[1]).toBe(true);

					expect(terminateSpy.calls.length).toBe(2);
					expect(terminateSpy.calls[0].arguments.length).toBe(0);
					expect(terminateSpy.calls[1].arguments.length).toBe(1);
					expect(terminateSpy.calls[1].arguments[0]).toBe(true);
				});
		});
	});
});
