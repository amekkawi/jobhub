var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var JobWorkerMediator = require('../../lib/JobWorkerMediator');
var MiddlewareStore = require('../../lib/MiddlewareStore');

describe('JobWorkerMediator', function() {
	function noCall() {
		throw new Error('Expected not to be called');
	}

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
				mediator.addListeners();
				reject(new Error('Expected to throw error for JobWorkerMediator#addListeners'))
			}).then(function() {
				throw new Error('Expected to not resolve for JobWorkerMediator#addListeners');
			}, function(err) {
				if (!(err instanceof Error) || err.message !== 'JobWorkerMediator#addListeners is abstract and must be overridden') {
					throw err;
				}
			}),
			new Promise(function(resolve, reject) {
				mediator.removeListeners();
				reject(new Error('Expected to throw error for JobWorkerMediator#removeListeners'))
			}).then(function() {
				throw new Error('Expected to not resolve for JobWorkerMediator#removeListeners');
			}, function(err) {
				if (!(err instanceof Error) || err.message !== 'JobWorkerMediator#removeListeners is abstract and must be overridden') {
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
				expect(this.addListeners.calls.length).toBe(0, 'Expected JobWorkerMediator#addListeners call count %s to be %s');
				expect(this.initStartupTimeout.calls.length).toBe(0, 'Expected JobWorkerMediator#initStartupTimeout call count %s to be %s');
			});
			expect.spyOn(this, 'addListeners').andCall(function() {
				expect(this.execWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#execWorker call count %s to be %s');
				expect(this.initStartupTimeout.calls.length).toBe(0, 'Expected JobWorkerMediator#initStartupTimeout call count %s to be %s');
			});
			expect.spyOn(this, 'initStartupTimeout').andCall(function() {
				expect(this.execWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#execWorker call count %s to be %s');
				expect(this.addListeners.calls.length).toBe(1, 'Expected JobWorkerMediator#addListeners call count %s to be %s');
			});
		});

		var mediator = new MediatorImpl(trackedJob);
		return mediator.startWorker()
			.then(function() {
				expect(mediator.execWorker.calls.length).toBe(1, 'Expected JobWorkerMediator#execWorker call count %s to be %s');
				expect(mediator.addListeners.calls.length).toBe(1, 'Expected JobWorkerMediator#addListeners call count %s to be %s');
				expect(mediator.initStartupTimeout.calls.length).toBe(1, 'Expected JobWorkerMediator#initStartupTimeout call count %s to be %s');
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
			},
			addListeners: function() {
				throw new Error('Expected not to be called');
			},
			removeListeners: function() {
				throw new Error('Expected not to be called');
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

	it('should catch errors thrown by JobWorkerMediator#addListeners and reject JobWorkerMediator#startWorker', function() {
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
			expect.spyOn(this, 'removeListeners').andCallThrough();
		}, {
			execWorker: function() {
				return Promise.resolve();
			},
			addListeners: function() {
				throw expectedError;
			},
			removeListeners: function() {
				expect(this.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
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
			expect(mediator.removeListeners.calls.length).toBe(1, 'Expected JobWorkerMediator#removeListeners call count %s to be %s');
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
			expect.spyOn(this, 'removeListeners').andCallThrough();
		}, {
			execWorker: function() {
				return Promise.resolve();
			},
			addListeners: function() {

			},
			initStartupTimeout: function() {
				throw expectedError;
			},
			removeListeners: function() {
				expect(this.stopMediation.calls.length).toBe(1, 'Expected JobWorkerMediator#stopMediation call count %s to be %s');
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
			expect(mediator.removeListeners.calls.length).toBe(1, 'Expected JobWorkerMediator#removeListeners call count %s to be %s');
		});
	});

	it('should resolve when JobWorkerMediator#handleSuccess is called', function() {
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

			},
			addListeners: function() {

			},
			removeListeners: function() {

			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject);
			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();
				mediator.handleSuccess(expectedResult);
			}).catch(reject);
		}).then(function(result) {
			expect(result).toBe(expectedResult);
		});
	});

	it('should resolve when JobWorkerMediator#handleError is called', function() {
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

			},
			addListeners: function() {

			},
			removeListeners: function() {

			}
		});

		var mediator;
		return new Promise(function(resolve, reject) {
			mediator = new MediatorImpl(trackedJob)
				.on(constants.EVENT_JOB_SUCCESS, resolve)
				.on(constants.EVENT_JOB_FAILURE, reject)
				.on(constants.EVENT_JOB_PROGRESS, noCall);
			mediator.startWorker().then(function() {
				mediator.handleStartupConfirmation();
				mediator.handleError(expectedError);
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

			},
			addListeners: function() {

			},
			removeListeners: function() {

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
			},
			addListeners: function() {

			},
			removeListeners: function() {

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
			expect.spyOn(this, 'removeListeners').andCallThrough();

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
			},
			addListeners: function() {
				expect(this.initStartupTimeout.calls.length).toBe(0);
				expect(this.beginStartupTimeout.calls.length).toBe(0);
			},
			removeListeners: function() {
				expect(this.initStartupTimeout.calls.length).toBe(1);
				expect(this.beginStartupTimeout.calls.length).toBe(1);
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

			expect(mediator.removeListeners.calls.length).toBe(1);
			expect(mediator.removeListeners.calls[0].context).toBe(mediator);
			expect(mediator.removeListeners.calls[0].arguments.length).toBe(0);

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

			},
			addListeners: function() {

			},
			removeListeners: function() {

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
