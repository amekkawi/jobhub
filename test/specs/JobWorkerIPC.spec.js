var inherits = require('util').inherits;
var path = require('path');
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var util = require('../../lib/util');
var JobWorker = require('../../lib/JobWorker');
var JobWorkerIPC = require('../../lib/JobWorkerIPC');
var MiddlewareStore = require('../../lib/MiddlewareStore');
var JobConfigStore = require('../../lib/JobConfigStore');

describe('JobWorkerIPC', function() {
	it('should set properties', function() {
		var worker = new JobWorkerIPC();

		expect(worker instanceof JobWorker).toBe(true, 'Expected JobWorkerIPC to be instance of JobWorker');

		expect(worker.jobId).toBe(void 0);
		expect(worker.jobName).toBe(void 0);
		expect(worker.params).toBe(void 0);
		expect(worker.options).toBe(void 0);
		expect(worker.payloadMessageTimeout).toBe(20000);
		expect(worker.running).toBe(false, 'Expected JobWorkerIPC#running %s to be %s');
		expect(worker.jobs).toBeA(JobConfigStore);
		expect(worker.promise).toBe(null);

		expect(worker.middleware).toBeA(MiddlewareStore, 'Expected JobWorkerIPC#middleware %s to be a %s');
		expect(worker.middleware.getSupportedSyncTypes()).toEqual(worker.getSupportedSyncMiddleware(), 'Expected supported sync middleware %s to equal %s');
		expect(worker.middleware.hasSyncSupport(constants.MIDDLEWARE_WORKER_LOAD_JOB)).toBe(true, 'Expected middleware support for "workerLoadJob"');
		expect(worker.middleware.hasSyncSupport(constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG)).toBe(true, 'Expected middleware support for "workerBuildJobArg"');
		expect(worker.jobs).toBeA(JobConfigStore, 'Expected JobWorkerIPC#jobs %s to be a %s');
	});

	describe('JobWorkerIPC#detatchFromIPC', function() {
		it('should remove disconnect and message listeners', function() {
			var spyProcessRemoveListener = expect.spyOn(process, 'removeListener').andCall(function() {
				return this;
			});

			var worker = new JobWorkerIPC();
			worker.detatchFromIPC();

			expect(spyProcessRemoveListener.calls.length).toBe(2);
			expect(spyProcessRemoveListener.calls[0].arguments.length).toBe(2);
			expect(spyProcessRemoveListener.calls[0].arguments[0]).toBe('disconnect');
			expect(spyProcessRemoveListener.calls[0].arguments[1]).toBe(worker.handleIPCDisconnect);
			expect(spyProcessRemoveListener.calls[1].arguments.length).toBe(2);
			expect(spyProcessRemoveListener.calls[1].arguments[0]).toBe('message');
			expect(spyProcessRemoveListener.calls[1].arguments[1]).toBe(worker.handleIPCMessage);
		});
	});

	describe('JobWorkerIPC#attachToIPC', function() {
		it('should call handleError if process.send is not set', function() {
			var worker = new JobWorkerIPC();

			expect.spyOn(worker, 'handleError').andCall(function() {
				return Promise.resolve();
			});

			worker.attachToIPC();

			expect(worker.handleError.calls.length).toBe(1);
			expect(worker.handleError.calls[0].arguments.length).toBe(1);
			expect(worker.handleError.calls[0].arguments[0]).toBeA(Error);
			expect(worker.handleError.calls[0].arguments[0].message).toBe('Job worker process must be called as forked node child process');
		});

		it('should call handleError if process.connected is false', function() {
			var worker = new JobWorkerIPC();

			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(){};

			expect(!process.connected).toBe(true);

			expect.spyOn(worker, 'handleError').andCall(function() {
				return Promise.resolve();
			});

			try {
				worker.attachToIPC();
			}
			catch (err) {
				delete process.send;
				throw err;
			}

			delete process.send;

			expect(worker.handleError.calls.length).toBe(1);
			expect(worker.handleError.calls[0].arguments.length).toBe(1);
			expect(worker.handleError.calls[0].arguments[0]).toBeA(Error);
			expect(worker.handleError.calls[0].arguments[0].message).toBe('Job worker process started with disconnected IPC channel');
		});

		it('should listen to disconnect and message process events', function() {
			var worker = new JobWorkerIPC();

			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(){};

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var handleErrorSpy = expect.spyOn(worker, 'handleError').andCall(function() {
				return Promise.resolve();
			});

			var spyProcessOn = expect.spyOn(process, 'on').andCall(function() {
				return this;
			});

			try {
				worker.attachToIPC();
			}
			catch (err) {
				delete process.send;
				delete process.connected;
				throw err;
			}

			delete process.send;
			delete process.connected;
			expect.restoreSpies();

			expect(handleErrorSpy.calls.length).toBe(0);

			expect(spyProcessOn.calls.length).toBe(2);
			expect(spyProcessOn.calls[0].arguments.length).toBe(2);
			expect(spyProcessOn.calls[0].arguments[0]).toBe('disconnect');
			expect(spyProcessOn.calls[0].arguments[1]).toBe(worker.handleIPCDisconnect);
			expect(spyProcessOn.calls[1].arguments.length).toBe(2);
			expect(spyProcessOn.calls[1].arguments[0]).toBe('message');
			expect(spyProcessOn.calls[1].arguments[1]).toBe(worker.handleIPCMessage);
		});
	});

	describe('JobWorkerIPC#handleIPCDisconnect', function() {
		it('should call handleError', function() {
			var worker = new JobWorkerIPC();

			expect.spyOn(worker, 'handleError').andCall(function() {
				return Promise.resolve();
			});

			worker.handleIPCDisconnect();

			expect(worker.handleError.calls.length).toBe(1);
			expect(worker.handleError.calls[0].arguments.length).toBe(1);
			expect(worker.handleError.calls[0].arguments[0]).toBeA(Error);
			expect(worker.handleError.calls[0].arguments[0].message).toBe('Job worker process lost connection to manager process. Exiting...');
		});
	});

	describe('JobWorkerIPC#handleIPCMessage', function() {
		it('should re-emit message', function() {
			var worker = new JobWorkerIPC();

			expect.spyOn(worker, 'emit').andCall(function() {
				return this;
			});

			var expectedMessage = {
				type: 'foo'
			};

			worker.handleIPCMessage(expectedMessage);

			expect(worker.emit.calls.length).toBe(1);
			expect(worker.emit.calls[0].arguments.length).toBe(2);
			expect(worker.emit.calls[0].arguments[0]).toBe('ipc-message::foo');
			expect(worker.emit.calls[0].arguments[1]).toBe(expectedMessage);
		});

		it('should not re-emit message if falsy or missing type', function() {
			var worker = new JobWorkerIPC();

			expect.spyOn(worker, 'emit').andCall(function() {
				return this;
			});

			worker.handleIPCMessage(true);
			worker.handleIPCMessage(false);
			worker.handleIPCMessage([]);
			worker.handleIPCMessage(1);
			worker.handleIPCMessage(0);
			worker.handleIPCMessage('foo');
			worker.handleIPCMessage(null);
			worker.handleIPCMessage(void 0);
			worker.handleIPCMessage({});
			worker.handleIPCMessage({ type: 500 });

			expect(worker.emit.calls.length).toBe(0);
		});
	});

	[
		{
			method: 'handleSuccess',
			willDetatchIPC: true,
			args: function() {
				return [{}];
			},
			sendMessage: function(args, message) {
				expect(message).toBeA(Object);
				expect(message.type).toBe(constants.JOB_MESSAGE_SUCCESS);
				expect(message.result).toBe(args[0]);
			}
		},
		{
			method: 'handleError',
			willDetatchIPC: true,
			args: function() {
				return [new Error('foo')];
			},
			sendMessage: function(args, message) {
				expect(message).toBeA(Object);
				expect(message.type).toBe(constants.JOB_MESSAGE_ERROR);
				expect(message.error).toBeA(Object);
				expect(message.error).toNotBe(args[0]);
				expect(message.error.message).toBe('foo');
			}
		},
		{
			method: 'handleProgress',
			args: function() {
				return [{}];
			},
			sendMessage: function(args, message) {
				expect(message).toBeA(Object);
				expect(message.type).toBe(constants.JOB_MESSAGE_PROGRESS);
				expect(message.progress).toBe(args[0]);
			}
		}
	].forEach(function(opts) {
		describe('JobWorkerIPC#' + opts.method, function() {
			it('should send IPC message', function() {
				expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
				var processSendSpy = process.send = expect.createSpy().andCall(function(data, fn) {
					fn();
					return this;
				});

				expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
				expect(!process.connected).toBe(true);
				process.connected = true;

				var worker = new JobWorkerIPC();

				expect.spyOn(worker, 'detatchFromIPC').andCall(function() {
					expect(processSendSpy.calls.length).toBe(0);
				});

				var args = opts.args();
				var promise = worker[opts.method].apply(worker, args);

				delete process.send;
				delete process.connected;

				expect(promise).toBeA(Promise);
				expect(worker.detatchFromIPC.calls.length).toBe(opts.willDetatchIPC ? 1 : 0);
				expect(processSendSpy.calls.length).toBe(1);
				expect(processSendSpy.calls[0].arguments.length).toBe(2);
				opts.sendMessage(args, processSendSpy.calls[0].arguments[0]);
				expect(processSendSpy.calls[0].arguments[1]).toBeA(Function);

				return promise;
			});

			it('should reject if failed to send IPC message', function() {
				expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
				var processSendSpy = process.send = expect.createSpy().andCall(function(data, fn) {
					fn(expectedError);
					return this;
				});

				expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
				expect(!process.connected).toBe(true);
				process.connected = true;

				var expectedError = new Error();

				var worker = new JobWorkerIPC();

				expect.spyOn(worker, 'detatchFromIPC').andCall(function() {
					expect(processSendSpy.calls.length).toBe(0);
				});

				var args = opts.args();
				var promise = worker[opts.method].apply(worker, args);

				delete process.send;
				delete process.connected;

				expect(promise).toBeA(Promise);
				expect(worker.detatchFromIPC.calls.length).toBe(opts.willDetatchIPC ? 1 : 0);
				expect(processSendSpy.calls.length).toBe(1);
				expect(processSendSpy.calls[0].arguments.length).toBe(2);
				opts.sendMessage(args, processSendSpy.calls[0].arguments[0]);
				expect(processSendSpy.calls[0].arguments[1]).toBeA(Function);

				return promise.then(function() {
					throw new Error('Expected to not resolve');
				}, function(err) {
					if (err !== expectedError) {
						throw err;
					}
				});
			});

			it('should just resolve if not connected', function() {
				expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
				var processSendSpy = process.send = expect.createSpy();

				expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
				expect(!process.connected).toBe(true);
				process.connected = false;

				var worker = new JobWorkerIPC();

				expect.spyOn(worker, 'detatchFromIPC').andCall(function() {
					expect(processSendSpy.calls.length).toBe(0);
				});

				var args = opts.args();
				var promise = worker[opts.method].apply(worker, args);

				delete process.send;
				delete process.connected;

				expect(promise).toBeA(Promise);
				expect(worker.detatchFromIPC.calls.length).toBe(opts.willDetatchIPC ? 1 : 0);
				expect(processSendSpy.calls.length).toBe(0);

				return promise;
			});
		});
	});

	describe('JobWorkerIPC#watchUncaughtException', function() {
		it('should listen for uncaught exceptions', function() {
			var worker = new JobWorkerIPC();

			var spyProcessOn = expect.spyOn(process, 'on').andCall(function() {
				return this;
			});

			worker.watchUncaughtException();

			expect.restoreSpies();

			expect(spyProcessOn.calls.length).toBe(1);
			expect(spyProcessOn.calls[0].arguments.length).toBe(2);
			expect(spyProcessOn.calls[0].arguments[0]).toBe('uncaughtException');
			expect(spyProcessOn.calls[0].arguments[1]).toBeA(Function);
		});
	});

	describe('JobWorkerIPC#requestIPCPayload', function() {
		it('should listen for payload event and send startup message', function() {
			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			var processSendSpy = process.send = expect.createSpy().andCall(function() {
				return this;
			});

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var timeoutUnrefSpy = expect.createSpy();
			var timeoutSpy = expect.spyOn(global, 'setTimeout').andReturn({
				unref: timeoutUnrefSpy
			});

			var worker = new JobWorkerIPC();

			var workerOnceSpy = expect.spyOn(worker, 'once').andCall(function() {
				return this;
			});

			var promise = worker.requestIPCPayload();

			delete process.send;
			delete process.connected;
			expect.restoreSpies();

			expect(promise).toBeA(Promise);
			expect(timeoutSpy.calls.length).toBe(1);
			expect(timeoutSpy.calls[0].arguments.length).toBe(2);
			expect(timeoutSpy.calls[0].arguments[0]).toBeA(Function);
			expect(timeoutSpy.calls[0].arguments[1]).toBe(worker.payloadMessageTimeout);
			expect(timeoutUnrefSpy.calls.length).toBe(1);
			expect(timeoutUnrefSpy.calls[0].arguments.length).toBe(0);
			expect(workerOnceSpy.calls.length).toBe(2);
			expect(workerOnceSpy.calls[0].arguments.length).toBe(2);
			expect(workerOnceSpy.calls[0].arguments[0]).toBe(constants.EVENT_JOB_ABORT);
			expect(workerOnceSpy.calls[0].arguments[1]).toBeA(Function);
			expect(workerOnceSpy.calls[1].arguments.length).toBe(2);
			expect(workerOnceSpy.calls[1].arguments[0]).toBe('ipc-message::' + constants.JOB_MESSAGE_PAYLOAD);
			expect(workerOnceSpy.calls[1].arguments[1]).toBeA(Function);
			expect(processSendSpy.calls.length).toBe(1);
			expect(processSendSpy.calls[0].arguments.length).toBe(2);
			expect(processSendSpy.calls[0].arguments[0]).toBeA(Object);
			expect(processSendSpy.calls[0].arguments[0].type).toBe(constants.JOB_MESSAGE_STARTUP);
			expect(processSendSpy.calls[0].arguments[1]).toBeA(Function);
		});

		it('should reject if abort received before payload', function() {
			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(data, cb) {
				cb();
			};

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var worker = new JobWorkerIPC();

			var promise = worker.requestIPCPayload()
				.then(function() {
					delete process.send;
					delete process.connected;
					throw new Error('Expected to not resolve');
				}, function(err) {
					delete process.send;
					delete process.connected;

					expect(err.message).toBe('Received abort message before job payload');
				});

			worker.emit(constants.EVENT_JOB_ABORT);

			return promise;
		});

		it('should reject with timeout error if payload message isn\'t received', function() {
			this.slow(450);
			this.timeout(500);

			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(data, cb) {
				cb();
			};

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var worker = new JobWorkerIPC();
			worker.payloadMessageTimeout = 200;

			return worker.requestIPCPayload()
				.then(function() {
					delete process.send;
					delete process.connected;
					throw new Error('Expected to not resolve');
				}, function(err) {
					delete process.send;
					delete process.connected;

					expect(err.message).toBe('Timeout for receiving job payload IPC message');
				});
		});

		it('should reject if process.send fails', function() {
			var expectedError = new Error('foo');

			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(data, cb) {
				cb(expectedError);
			};

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var worker = new JobWorkerIPC();

			return worker.requestIPCPayload().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				delete process.send;
				delete process.connected;

				if (err !== expectedError) {
					throw err;
				}

				expect(err.message).toBe('Failed to send job startup confirmation: foo');
			});
		});

		it('should resolve when payload is received', function() {
			expect(Object.prototype.hasOwnProperty.call(process, 'send')).toBe(false);
			process.send = function(data, cb) {
				cb();
			};

			expect(Object.prototype.hasOwnProperty.call(process, 'connected')).toBe(false);
			expect(!process.connected).toBe(true);
			process.connected = true;

			var expectedPayload = {};
			var worker = new JobWorkerIPC();

			var promise = worker.requestIPCPayload();

			worker.emit('ipc-message::' + constants.JOB_MESSAGE_PAYLOAD, expectedPayload);

			return promise.then(function(result) {
				delete process.send;
				delete process.connected;
				expect(result).toBe(expectedPayload);
			}, function(err) {
				delete process.send;
				delete process.connected;
				throw err;
			});
		});
	});

	describe('JobWorkerIPC#init', function() {
		it('should call protected methods, set props, and calls JobWorker#init', function() {
			var expectedPayload = {
				options: {},
				job: {
					jobId: 'foo',
					jobName: 'bar',
					params: {
						foobar: 500
					}
				}
			};
			var worker = new JobWorkerIPC();

			expect.spyOn(worker, 'attachToIPC').andCall(function() {
				expect(worker.attachToIPC.calls.length).toBe(1);
				expect(worker.watchUncaughtException.calls.length).toBe(0);
				expect(worker.requestIPCPayload.calls.length).toBe(0);
				expect(arguments.length).toBe(0);
			});

			expect.spyOn(worker, 'watchUncaughtException').andCall(function() {
				expect(worker.attachToIPC.calls.length).toBe(1);
				expect(worker.watchUncaughtException.calls.length).toBe(1);
				expect(worker.requestIPCPayload.calls.length).toBe(0);
				expect(arguments.length).toBe(0);
			});

			expect.spyOn(worker, 'requestIPCPayload').andCall(function() {
				expect(worker.attachToIPC.calls.length).toBe(1);
				expect(worker.watchUncaughtException.calls.length).toBe(1);
				expect(worker.requestIPCPayload.calls.length).toBe(1);
				expect(arguments.length).toBe(0);
				return Promise.resolve(expectedPayload);
			});

			var protoInitSpy = expect.spyOn(JobWorker.prototype, 'init').andCall(function() {
				expect(this).toBe(worker);
				expect(arguments.length).toBe(0);

				expect(worker.options).toBe(expectedPayload.options);
				expect(worker.jobId).toBe(expectedPayload.job.jobId);
				expect(worker.jobName).toBe(expectedPayload.job.jobName);
				expect(worker.params).toBe(expectedPayload.job.params);
				return Promise.resolve();
			});

			var promise = worker.init();
			expect(promise).toBeA(Promise);

			expect(worker.attachToIPC.calls.length).toBe(1);
			expect(worker.watchUncaughtException.calls.length).toBe(1);
			expect(worker.requestIPCPayload.calls.length).toBe(1);

			return promise.then(function() {
				protoInitSpy.restore();
				expect(protoInitSpy.calls.length).toBe(1);
			}, function(err) {
				protoInitSpy.restore();
				throw err;
			});
		});
	});
});
