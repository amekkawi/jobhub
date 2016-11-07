var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var JobWorkerMediator = require('../../lib/JobWorkerMediator');
var MiddlewareStore = require('../../lib/MiddlewareStore');

describe('JobWorkerMediator', function() {
	function createManagerFixture(overrides) {
		overrides = overrides || {};
		return {
			options: Object.assign({
				workerStartupTimeout: 0
			}, overrides.options || {}),
			middleware: new MiddlewareStore()
		};
	}

	function extendJobWorkerMediator(fn, overrides) {
		inherits(fn, JobWorkerMediator);
		Object.assign(fn.prototype, overrides);
		return fn;
	}

	it('should set properties from constructor', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};
		var mediator = new JobWorkerMediator(trackedJob);
		expect(mediator.trackedJob).toBe(trackedJob, 'Expected JobWorkerMediator#trackedJob %s to be the tracked job');
		expect(mediator.started).toBe(false, 'Expected JobWorkerMediator#started %s to be %s');
		expect(mediator.settled).toBe(false, 'Expected JobWorkerMediator#settled %s to be %s');
		expect(mediator.exited).toBe(false, 'Expected JobWorkerMediator#exited %s to be %s');
		expect(mediator.processId).toBe(null, 'Expected JobWorkerMediator#processId %s to be %s');
		expect(mediator instanceof EventEmitter).toBe(true, 'Expected JobWorkerMediator to be instance of EventEmitter');
	});

	it('should throw error if not implemented abstract methods', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {});

		var mediator = new MediatorImpl(trackedJob);

		return Promise.all([
			new Promise(function(resolve, reject) {
				mediator.execWorker();
				reject(new Error('Expected to throw error for JobWorkerMediator#execWorker'))
			}).then(function() {
				throw new Error('Expected to not resolve for JobWorkerMediator#execWorker');
			}, function(err) {
				if (!(err instanceof Error) || err.message !== 'JobWorkerMediator#execWorker is abstract and must be overridden') {
					throw err;
				}
			}),
			new Promise(function(resolve, reject) {
				mediator.terminate();
				reject(new Error('Expected to throw error for JobWorkerMediator#terminate'))
			}).then(function() {
				throw new Error('Expected to not resolve for JobWorkerMediator#terminate');
			}, function(err) {
				if (!(err instanceof Error) || err.message !== 'JobWorkerMediator#terminate is abstract and must be overridden') {
					throw err;
				}
			})
		]);
	});

	it('should call protected methods during JobWorkerMediator#startWorker', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
			expect.spyOn(this, 'execWorker').andCall(function() {
				expect(this.initStartupTimeout.calls.length).toBe(1, 'Expected JobWorkerMediator#initStartupTimeout call count %s to be %s');
				expect(this.started).toBe(false, 'Expected JobWorkerMediator#started %s to be %s');
			});
			expect.spyOn(this, 'initStartupTimeout').andCall(function() {
				expect(this.execWorker.calls.length).toBe(0, 'Expected JobWorkerMediator#execWorker call count %s to be %s');
				expect(this.started).toBe(false, 'Expected JobWorkerMediator#started %s to be %s');
			});
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker()
			.then(function() {
				expect(mediator.execWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#execWorker call count %s to be %s');
				expect(mediator.initStartupTimeout.calls.length).toBe(1, 'Expected JobWorkerMediator#initStartupTimeout call count %s to be %s');
				expect(mediator.started).toBe(true, 'Expected JobWorkerMediator#started %s to be %s');
			});
	});

	it('should allow JobWorkerMediator#execWorker to return Promise to JobWorkerMediator#startWorker', function() {
		var expectedError = new Error();
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {
				return Promise.reject(expectedError);
			}
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker().then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}
		});
	});

	it('should catch thrown errors by JobWorkerMediator#execWorker and reject JobWorkerMediator#startWorker', function() {
		var expectedError = new Error();
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {
				throw expectedError;
			}
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker().then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}
		});
	});

	it('should catch errors thrown by JobWorkerMediator#initStartupTimeout and reject JobWorkerMediator#startWorker', function() {
		var expectedError = new Error();
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
			expect.spyOn(this, 'stopMediation').andCallThrough();
		}, {
			execWorker: function() {
				throw new Error('Expected JobWorkerMediator#execWorker to not be called');
			},
			initStartupTimeout: function() {
				throw expectedError;
			}
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker().then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}

			expect(mediator.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
		});
	});

	it('should stop mediation and emit JOB_SUCCESS when JobWorkerMediator#handleSuccess is called', function() {
		var expectedResult = {};

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {

			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			var successEventSpy = expect.createSpy().andCall(function() {
				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				return resolve.apply(this, arguments);
			});

			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, successEventSpy)
				.on(constants.EVENT_JOB_FAILURE, reject);

			expect.spyOn(mediator, 'stopMediation').andCall(function() {
				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(successEventSpy.calls.length).toBe(0, 'Expected JOB_SUCCESS emit count %s to be %s');
			});

			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();

				expect(mediator.settled).toBe(false, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(0, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				expect(successEventSpy.calls.length).toBe(0, 'Expected JOB_SUCCESS emit count %s to be %s');

				mediator.handleSuccess(expectedResult);

				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				expect(successEventSpy.calls.length).toBe(1, 'Expected JOB_SUCCESS emit count %s to be %s');

			}).catch(reject);
		}).then(function(result) {
			expect(result).toBe(expectedResult);
		});
	});

	it('should stop mediation and emit JOB_FAILURE when JobWorkerMediator#handleError is called', function() {
		var expectedError = new Error();

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {

			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			var failureEventSpy = expect.createSpy().andCall(function() {
				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				return reject.apply(this, arguments);
			});

			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, failureEventSpy);

			expect.spyOn(mediator, 'stopMediation').andCall(function() {
				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(failureEventSpy.calls.length).toBe(0, 'Expected JOB_FAILURE emit count %s to be %s');
			});

			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();

				expect(mediator.settled).toBe(false, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(0, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				expect(failureEventSpy.calls.length).toBe(0, 'Expected JOB_FAILURE emit count %s to be %s');

				mediator.handleError(expectedError);

				expect(mediator.settled).toBe(true, 'Expected JobWorkerMediator#settled %s to be %s');
				expect(mediator.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
				expect(failureEventSpy.calls.length).toBe(1, 'Expected JOB_FAILURE emit count %s to be %s');
			}).catch(reject);
		}).then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (err !== expectedError) {
				throw err;
			}
		});
	});

	it('should send progress when JobWorkerMediator#handleProgress is called', function() {
		var expectedProgressA = {};
		var expectedProgressB = {};

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {

			}
		});

		var spyProgress = expect.createSpy();

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject)
				.on(constants.EVENT_JOB_PROGRESS, spyProgress);
			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();
				mediator.handleProgress(expectedProgressA);
				mediator.handleProgress(expectedProgressB);
				mediator.handleSuccess();
			}).catch(reject);
		}).then(function() {
			expect(spyProgress.calls.length).toBe(2, 'Expected JobWorkerMediator#handleProgress call count %s to be %s');
			expect(spyProgress.calls[0].arguments.length).toBe(1, 'Expected JobWorkerMediator#handleProgress calls[0].arguments %s to be %s');
			expect(spyProgress.calls[0].arguments[0]).toBe(expectedProgressA, 'Expected JobWorkerMediator#handleProgress calls[0].arguments[0] %s to be %s');
			expect(spyProgress.calls[1].arguments.length).toBe(1, 'Expected JobWorkerMediator#handleProgress calls[1].arguments %s to be %s');
			expect(spyProgress.calls[1].arguments[0]).toBe(expectedProgressB, 'Expected JobWorkerMediator#handleProgress calls[1].arguments[0] %s to be %s');
		});
	});

	it('should set JobWorkerMediator#exited and emit JOB_EXIT when JobWorkerMediator#handleExit is called', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {

			}
		});

		var spyExitEvent = expect.createSpy().andCall(function() {
			expect(mediator.exited).toBe(true, 'Expected JobWorkerMediator#exited %s to be %s');
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject)
				.on(constants.EVENT_JOB_EXIT, spyExitEvent);
			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();
				mediator.handleSuccess();
				expect(mediator.exited).toBe(false, 'Expected JobWorkerMediator#exited %s to be %s');
				expect(spyExitEvent.calls.length).toBe(0, 'Expected JOB_EXIT emit count %s to be %s');
				mediator.handleExit();
				expect(mediator.exited).toBe(true, 'Expected JobWorkerMediator#exited %s to be %s');
				expect(spyExitEvent.calls.length).toBe(1, 'Expected JOB_EXIT emit count %s to be %s');
			}).catch(reject);
		}).then(function() {
			expect(mediator.exited).toBe(true, 'Expected JobWorkerMediator#exited %s to be %s');
			expect(spyExitEvent.calls.length).toBe(1, 'Expected JOB_EXIT emit count %s to be %s');
		});
	});

	it('should not begin timeout if manager option is <= 0', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture({
				options: {
					workerStartupTimeout: 0
				}
			})
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
			expect.spyOn(this, 'beginStartupTimeout').andCallThrough();
		}, {
			execWorker: function() {
				return Promise.resolve();
			}
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker().then(function() {
			expect(mediator.beginStartupTimeout.calls.length).toBe(0, 'Expected JobWorkerMediator#beginStartupTimeout call count %s to be %s');
		});
	});

	it('should timeout startup if manager option is > 0', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture({
				options: {
					workerStartupTimeout: 10
				}
			})
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);

			var initStartupTimeout = this.initStartupTimeout;
			expect.spyOn(this, 'initStartupTimeout').andCall(function() {
				expect(this.beginStartupTimeout.calls.length).toBe(0);
				var ret = initStartupTimeout.apply(this, arguments);
				expect(this.beginStartupTimeout.calls.length).toBe(1);
				return ret;
			});

			var beginStartupTimeoutFn = this.beginStartupTimeout;
			expect.spyOn(this, 'beginStartupTimeout').andCall(function() {
				expect(this.initStartupTimeout.calls.length).toBe(1);
				return beginStartupTimeoutFn.apply(this, arguments);
			});

			var handleStartupTimeoutFn = this.handleStartupTimeout;
			expect.spyOn(this, 'handleStartupTimeout').andCall(function() {
				expect(this.initStartupTimeout.calls.length).toBe(1);
				return handleStartupTimeoutFn.apply(this, arguments);
			});
		}, {
			execWorker: function() {
				return Promise.resolve();
			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject);
			mediator.startWorker().catch(reject);
		}).then(function() {
			throw new Error('Expected to not resolve');
		}, function(err) {
			if (!(err instanceof errors.JobForkError)) {
				throw err;
			}

			expect(err.message).toBe('Job took too long to send a start confirmation message', 'Expected JobForkError#message %s to be %s');
			expect(err.jobId).toBe(trackedJob.jobId, 'Expected JobForkError#jobId %s to be %s');
			expect(err.jobName).toBe(trackedJob.jobConfig.jobName, 'Expected JobForkError#jobName %s to be %s');

			expect(mediator.initStartupTimeout.calls.length).toBe(1);
			expect(mediator.initStartupTimeout.calls[0].context).toBe(mediator);
			expect(mediator.initStartupTimeout.calls[0].arguments.length).toBe(0);

			expect(mediator.beginStartupTimeout.calls.length).toBe(1);
			expect(mediator.beginStartupTimeout.calls[0].context).toBe(mediator);
			expect(mediator.beginStartupTimeout.calls[0].arguments.length).toBe(1);
			expect(mediator.beginStartupTimeout.calls[0].arguments[0]).toBe(10);

			expect(mediator.handleStartupTimeout.calls.length).toBe(1);
			expect(mediator.handleStartupTimeout.calls[0].context).toBe(mediator);
			expect(mediator.handleStartupTimeout.calls[0].arguments.length).toBe(0);
		});
	});

	it('should clear timeout startup once JobWorkerMediator#handleStartupConfirmation is called', function() {
		var expectedResult = {};

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture({
				options: {
					workerStartupTimeout: 10
				}
			})
		};

		var MediatorImpl = extendJobWorkerMediator(function() {
			JobWorkerMediator.apply(this, arguments);
		}, {
			execWorker: function() {

			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject);
			mediator.startWorker().then(function() {
				setTimeout(function() {
					mediator.handleStartupConfirmation();
				}, 1);

				setTimeout(function() {
					mediator.handleSuccess(expectedResult);
				}, 20);
			}).catch(reject);
		}).then(function(result) {
			expect(result).toBe(expectedResult);
		});
	});
});
