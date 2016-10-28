var path = require('path');
var fork = require('child_process').fork;
var ChildProcess = require('child_process').ChildProcess;
var EventEmitter = require('events').EventEmitter;
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var JobWorkerIPCMediator = require('../../lib/JobWorkerIPCMediator');
var MiddlewareStore = require('../../lib/MiddlewareStore');

describe('JobWorkerIPCMediator', function() {
	var badWorkerPath = path.join(__dirname, '..', 'fixtures', 'bad-worker.js');

	function createChildProcessFixture(overrides) {
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
		}, overrides);
	}

	function createManagerFixture(overrides) {
		overrides = overrides || {};
		return {
			options: Object.assign({
				forkModulePath: badWorkerPath,
				workerStartupTimeout: 0
			}, overrides.options || {}),
			middleware: new MiddlewareStore()
				.addSupportedSyncTypes([
					constants.MIDDLEWARE_FORK_JOB_PROCESS,
					constants.MIDDLEWARE_BUILD_FORK_ARGS,
					constants.MIDDLEWARE_BUILD_FORK_OPTS
				])
		};
	}

	it('should set properties in constructor', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};
		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect(mediator.trackedJob).toBe(trackedJob, 'Expected JobWorkerIPCMediator#trackedJob %s to be the tracked job');
		expect(mediator.started).toBe(false, 'Expected JobWorkerIPCMediator#started %s to be %s');
		expect(mediator.exited).toBe(false, 'Expected JobWorkerIPCMediator#exited %s to be %s');
		expect(mediator.childProcess).toBe(null, 'Expected JobWorkerIPCMediator#childProcess %s to be %s');
	});

	it('should allow middeware to customize fork args, opts and the forking itself', function() {
		var childProcess;

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var middlewareArgs = [
			'--useIPC',
			'--fakeOpt'
		];

		var middlewareOpts = {
			'--fake-something': true
		};

		var spyArgs = expect.createSpy().andCall(function() {
			expect(spyArgs.calls.length).toBe(1);
			expect(spyOpts.calls.length).toBe(0);
			expect(spyFork.calls.length).toBe(0);

			expect(this).toBe(trackedJob);
			expect(arguments.length).toBe(2);
			expect(arguments[0]).toBe(trackedJob);
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

		var spyOpts = expect.createSpy().andCall(function() {
			expect(spyArgs.calls.length).toBe(1);
			expect(spyOpts.calls.length).toBe(1);
			expect(spyFork.calls.length).toBe(0);

			expect(this).toBe(trackedJob);
			expect(arguments.length).toBe(2);
			expect(arguments[0]).toBe(trackedJob);
			expect(arguments[1]).toBeA(Function);

			// Check what would have been returned if not intercepted
			var origRet = arguments[1](); // Next
			expect(origRet).toBeA(Object);
			expect(Object.keys(origRet).length).toBe(0);

			return middlewareOpts;
		});

		var spyFork = expect.createSpy().andCall(function() {
			expect(mediator.addChildListeners.calls.length).toBe(0, 'Expected JobWorkerIPCMediator#addChildListeners call count %s to be %s');

			expect(spyArgs.calls.length).toBe(1);
			expect(spyOpts.calls.length).toBe(1);
			expect(spyFork.calls.length).toBe(1);

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

		trackedJob.manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_BUILD_FORK_ARGS,
			spyArgs
		);

		trackedJob.manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_BUILD_FORK_OPTS,
			spyOpts
		);

		trackedJob.manager.middleware.addSyncMiddlware(
			constants.MIDDLEWARE_FORK_JOB_PROCESS,
			spyFork
		);

		var mediator = new JobWorkerIPCMediator(trackedJob);

		expect.spyOn(mediator, 'addChildListeners').andCall(function() {
			expect(spyFork.calls.length).toBe(1, 'Expected MIDDLEWARE_FORK_JOB_PROCESS middleware call count %s to be %s');
		});

		return mediator.execWorker().then(function() {
			expect(spyArgs.calls.length).toBe(1, 'Expected MIDDLEWARE_BUILD_FORK_ARGS middleware call count %s to be %s');
			expect(spyOpts.calls.length).toBe(1, 'Expected MIDDLEWARE_BUILD_FORK_OPTS middleware call count %s to be %s');
			expect(spyFork.calls.length).toBe(1, 'Expected MIDDLEWARE_FORK_JOB_PROCESS middleware call count %s to be %s');
			expect(mediator.childProcess).toBe(childProcess, 'Expected JobWorkerIPCMediator#childProcess %s to be created childProcess');
			expect(mediator.addChildListeners.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#addChildListeners call count %s to be %s');
		});
	});

	it('should add and remove listeners', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);

		var childProcess = mediator.childProcess = createChildProcessFixture();
		expect.spyOn(childProcess, 'on').andCallThrough();
		expect.spyOn(childProcess, 'removeListener').andCallThrough();

		mediator.addChildListeners();
		expect(childProcess.on.calls.length).toBe(5, 'Expected childProcess#on call count %s to be %s');
		expect(childProcess.on.calls[0].arguments.length).toBe(2);
		expect(childProcess.on.calls[0].arguments[0]).toBe('message');
		expect(childProcess.on.calls[0].arguments[1]).toBe(mediator.handleChildMessage);
		expect(childProcess.on.calls[1].arguments.length).toBe(2);
		expect(childProcess.on.calls[1].arguments[0]).toBe('disconnect');
		expect(childProcess.on.calls[1].arguments[1]).toBe(mediator.handleChildDisconnect);
		expect(childProcess.on.calls[2].arguments.length).toBe(2);
		expect(childProcess.on.calls[2].arguments[0]).toBe('error');
		expect(childProcess.on.calls[2].arguments[1]).toBe(mediator.handleChildError);
		expect(childProcess.on.calls[3].arguments.length).toBe(2);
		expect(childProcess.on.calls[3].arguments[0]).toBe('close');
		expect(childProcess.on.calls[3].arguments[1]).toBe(mediator.handleChildClose);
		expect(childProcess.on.calls[4].arguments.length).toBe(2);
		expect(childProcess.on.calls[4].arguments[0]).toBe('exit');
		expect(childProcess.on.calls[4].arguments[1]).toBe(mediator.handleChildExit);

		mediator.stopMediation();
		expect(childProcess.removeListener.calls.length).toBe(4, 'Expected childProcess#removeListener call count %s to be %s');
		expect(childProcess.removeListener.calls[0].arguments.length).toBe(2);
		expect(childProcess.removeListener.calls[0].arguments[0]).toBe('message');
		expect(childProcess.removeListener.calls[0].arguments[1]).toBe(mediator.handleChildMessage);
		expect(childProcess.removeListener.calls[1].arguments.length).toBe(2);
		expect(childProcess.removeListener.calls[1].arguments[0]).toBe('disconnect');
		expect(childProcess.removeListener.calls[1].arguments[1]).toBe(mediator.handleChildDisconnect);
		expect(childProcess.removeListener.calls[2].arguments.length).toBe(2);
		expect(childProcess.removeListener.calls[2].arguments[0]).toBe('error');
		expect(childProcess.removeListener.calls[2].arguments[1]).toBe(mediator.handleChildError);
		expect(childProcess.removeListener.calls[3].arguments.length).toBe(2);
		expect(childProcess.removeListener.calls[3].arguments[0]).toBe('close');
		expect(childProcess.removeListener.calls[3].arguments[1]).toBe(mediator.handleChildClose);
	});

	it('should call handlers on childProcess events', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);

		var childProcess = mediator.childProcess = createChildProcessFixture();

		var expectedMessage = {};
		var expectedError = new Error();

		expect.spyOn(mediator, 'handleChildMessage').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(expectedMessage, 'Expected arguments[0] %s to be %s');
		});

		expect.spyOn(mediator, 'handleChildDisconnect').andCall(function() {
			expect(arguments.length).toBe(0, 'Expected arguments length %s to be %s');
		});

		expect.spyOn(mediator, 'handleChildError').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be %s');
		});

		expect.spyOn(mediator, 'handleChildClose').andCall(function() {
			expect(arguments.length).toBe(2, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(50, 'Expected arguments[0] %s to be %s');
			expect(arguments[1]).toBe('SIG', 'Expected arguments[1] %s to be %s');
		});

		expect.spyOn(mediator, 'handleChildExit');

		mediator.addChildListeners();

		childProcess.emit('message', expectedMessage);
		expect(mediator.handleChildMessage.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#handleChildMessage call count %s to be %s');

		childProcess.emit('disconnect');
		expect(mediator.handleChildDisconnect.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#handleChildDisconnect call count %s to be %s');

		childProcess.emit('error', expectedError);
		expect(mediator.handleChildError.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#handleChildError call count %s to be %s');

		childProcess.emit('close', 50, 'SIG');
		expect(mediator.handleChildClose.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#handleChildClose call count %s to be %s');

		childProcess.emit('exit');
		expect(mediator.handleChildExit.calls.length).toBe(1, 'Expected JobWorkerIPCMediator#handleChildExit call count %s to be %s');
	});

	it('should call handleStartupConfirmation on JOB_MESSAGE_STARTUP message and then send payload', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);

		var childProcess = mediator.childProcess = createChildProcessFixture();
		expect.spyOn(childProcess, 'send').andCall(function() {
			expect(arguments.length).toBe(2, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBeA(Object, 'Expected arguments[0] %s to be an object');
			expect(arguments[0].type).toBe(constants.JOB_MESSAGE_PAYLOAD, 'Expected arguments[0].type %s to be %s');
			expect(arguments[0].options).toBe(trackedJob.manager.options, 'Expected arguments[0].options %s to be manger options');
			expect(arguments[0].job).toBeA(Object, 'Expected arguments[0].job %s to be an object');
			expect(arguments[0].job.jobId).toBe(trackedJob.jobId, 'Expected arguments[0].job.jobId %s to be %s');
			expect(arguments[0].job.jobName).toBe(trackedJob.jobConfig.jobName, 'Expected arguments[0].job.jobName %s to be %s');
			expect(arguments[0].job.params).toBe(trackedJob.params, 'Expected arguments[0].job.params %s to be params');
			expect(arguments[1]).toBeA(Function, 'Expected arguments[0] %s to be a %s');
			arguments[1]();
			return true;
		});

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_STARTUP
		});

		expect(childProcess.send.calls.length).toBe(1, 'Expected childProcess#send call count %s to be %s');
	});

	it('should catch error while sending payload in handleStartupConfirmation', function() {
		var expectedError = new Error('FOO');
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBeA(errors.JobForkError);
			expect(arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
			expect(arguments[0].jobId).toBe(trackedJob.jobId);
			expect(arguments[0].error).toBe(expectedError);
			expect(arguments[0].stack).toBe(expectedError.stack);
		});

		var childProcess = mediator.childProcess = createChildProcessFixture();
		expect.spyOn(childProcess, 'send').andCall(function() {
			arguments[1](expectedError);
			return true;
		});

		mediator.handleStartupConfirmation();

		expect(childProcess.send.calls.length).toBe(1, 'Expected childProcess#send call count %s to be %s');
		expect(mediator.handleError.calls.length).toBe(1, 'Expected JobWorkerMediator#handleError call count %s to be %s');
	});

	it('should call handleSuccess on JOB_MESSAGE_SUCCESS message', function() {
		var expectedResult = {};
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleSuccess').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(expectedResult, 'Expected arguments[0] %s to be %s');
		});

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_SUCCESS,
			result: expectedResult
		});

		expect(mediator.handleSuccess.calls.length).toBe(1, 'Expected JobWorkerMediator#handleSuccess call count %s to be %s');
	});

	it('should call handleProgress on JOB_MESSAGE_PROGRESS message', function() {
		var expectedProgress = {};
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleProgress').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(expectedProgress, 'Expected arguments[0] %s to be %s');
		});

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_PROGRESS,
			progress: expectedProgress
		});

		expect(mediator.handleProgress.calls.length).toBe(1, 'Expected JobWorkerMediator#handleProgress call count %s to be %s');
	});

	it('should call handleError on JOB_MESSAGE_ERROR message', function() {
		var expectedError = new Error();
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError').andCall(function() {
			expect(arguments.length).toBe(1, 'Expected arguments length %s to be %s');
			expect(arguments[0]).toBe(expectedError, 'Expected arguments[0] %s to be %s');
		});

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_ERROR,
			error: expectedError
		});

		expect(mediator.handleError.calls.length).toBe(1, 'Expected JobWorkerMediator#handleError call count %s to be %s');
	});

	it('should normalize non-Error on JOB_MESSAGE_ERROR message', function() {
		var expectedErrorA = { message: 'BAD' };
		var expectedErrorB = {};

		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError');

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_ERROR,
			error: expectedErrorA
		});

		mediator.handleChildMessage({
			type: constants.JOB_MESSAGE_ERROR,
			error: expectedErrorB
		});

		expect(mediator.handleError.calls.length).toBe(2, 'Expected JobWorkerMediator#handleError call count %s to be %s');
		expect(mediator.handleError.calls[0].arguments.length).toBe(1);
		expect(mediator.handleError.calls[0].arguments[0]).toBeA(errors.JobForkError);
		expect(mediator.handleError.calls[0].arguments[0].message).toBe(expectedErrorA.message);
		expect(mediator.handleError.calls[0].arguments[0].jobId).toBe(trackedJob.jobId);
		expect(mediator.handleError.calls[0].arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
		expect(mediator.handleError.calls[0].arguments[0].error).toBe(expectedErrorA);
		expect(mediator.handleError.calls[1].arguments.length).toBe(1);
		expect(mediator.handleError.calls[1].arguments[0]).toBeA(errors.JobForkError);
		expect(mediator.handleError.calls[1].arguments[0].message).toBe('Job worker sent an error without a message');
		expect(mediator.handleError.calls[1].arguments[0].jobId).toBe(trackedJob.jobId);
		expect(mediator.handleError.calls[1].arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
		expect(mediator.handleError.calls[1].arguments[0].error).toBe(expectedErrorB);
	});

	it('should handle "disconnect" childProcess event', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError');

		mediator.handleChildDisconnect();

		expect(mediator.handleError.calls.length).toBe(1, 'Expected JobWorkerMediator#handleError call count %s to be %s');
		expect(mediator.handleError.calls[0].arguments.length).toBe(1);
		expect(mediator.handleError.calls[0].arguments[0]).toBeA(errors.JobForkError);
		expect(mediator.handleError.calls[0].arguments[0].message).toBe('Job unexpectedly closed IPC connection');
		expect(mediator.handleError.calls[0].arguments[0].jobId).toBe(trackedJob.jobId);
		expect(mediator.handleError.calls[0].arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
	});

	it('should handle "error" childProcess event', function() {
		var expectedError = new Error();
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError');

		mediator.handleChildError(expectedError);

		expect(mediator.handleError.calls.length).toBe(1, 'Expected JobWorkerMediator#handleError call count %s to be %s');
		expect(mediator.handleError.calls[0].arguments.length).toBe(1);
		expect(mediator.handleError.calls[0].arguments[0]).toBeA(errors.JobForkError);
		expect(mediator.handleError.calls[0].arguments[0].message).toBe('Job encountered an unrecoverable error');
		expect(mediator.handleError.calls[0].arguments[0].jobId).toBe(trackedJob.jobId);
		expect(mediator.handleError.calls[0].arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
		expect(mediator.handleError.calls[0].arguments[0].error).toBe(expectedError);
	});

	it('should handle "close" childProcess event', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleError');

		mediator.handleChildClose(50, 'SIG');

		expect(mediator.handleError.calls.length).toBe(1, 'Expected JobWorkerMediator#handleError call count %s to be %s');
		expect(mediator.handleError.calls[0].arguments.length).toBe(1);
		expect(mediator.handleError.calls[0].arguments[0]).toBeA(errors.JobForkError);
		expect(mediator.handleError.calls[0].arguments[0].message).toBe('Job exited unexpectedly');
		expect(mediator.handleError.calls[0].arguments[0].jobId).toBe(trackedJob.jobId);
		expect(mediator.handleError.calls[0].arguments[0].jobName).toBe(trackedJob.jobConfig.jobName);
		expect(mediator.handleError.calls[0].arguments[0].code).toBe(50);
		expect(mediator.handleError.calls[0].arguments[0].signal).toBe('SIG');
	});

	it('should handle "exit" childProcess event', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var mediator = new JobWorkerIPCMediator(trackedJob);
		expect.spyOn(mediator, 'handleExit');

		mediator.childProcess = createChildProcessFixture();
		expect.spyOn(mediator.childProcess, 'removeListener');

		mediator.handleChildExit();

		expect(mediator.childProcess.removeListener.calls.length).toBe(1, 'Expected JobWorkerMediator#handleExit call count %s to be %s');
		expect(mediator.childProcess.removeListener.calls[0].arguments.length).toBe(2);
		expect(mediator.childProcess.removeListener.calls[0].arguments[0]).toBe('exit');
		expect(mediator.childProcess.removeListener.calls[0].arguments[1]).toBe(mediator.handleChildExit);
		expect(mediator.handleExit.calls.length).toBe(1, 'Expected JobWorkerMediator#handleExit call count %s to be %s');
		expect(mediator.handleExit.calls[0].arguments.length).toBe(0);
	});

	it('should terminate child process if started and not yet exited', function() {
		var trackedJob = {
			jobId: 'BAR',
			jobConfig: {
				jobName: 'FOO'
			},
			params: {},
			manager: createManagerFixture()
		};

		var childProcess = createChildProcessFixture({
			kill: expect.createSpy()
		});

		var mediator = new JobWorkerIPCMediator(trackedJob);

		mediator.terminate();
		mediator.terminate(true);
		expect(childProcess.kill.calls.length).toBe(0);

		mediator.childProcess = childProcess;
		mediator.terminate();
		mediator.terminate(true);
		expect(childProcess.kill.calls.length).toBe(0);

		mediator.started = true;
		mediator.terminate();
		mediator.terminate(true);
		expect(mediator.childProcess.kill.calls.length).toBe(2);
		expect(mediator.childProcess.kill.calls[0].arguments.length).toBe(0);
		expect(mediator.childProcess.kill.calls[1].arguments.length).toBe(1);
		expect(mediator.childProcess.kill.calls[1].arguments[0]).toBe(9);

		mediator.exited = true;
		mediator.terminate();
		mediator.terminate(true);
		expect(mediator.childProcess.kill.calls.length).toBe(2);
	});
});
