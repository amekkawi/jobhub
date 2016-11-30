var fork = require('child_process').fork;
var inherits = require('util').inherits;
var util = require('./util');
var constants = require('./constants');
var errors = require('./errors');
var JobWorkerMediator = require('./JobWorkerMediator');

module.exports = JobWorkerIPCMediator;

/**
 * @classdesc Manages a job's forked process during it's normal lifecycle.
 *
 * @class
 * @augments {JobWorkerMediator}
 * @param {TrackedJob} trackedJob
 */
function JobWorkerIPCMediator(trackedJob) {

	/**
	 * @member {ChildProcess|null} JobWorkerIPCMediator#childProcess
	 */
	this.childProcess = null;

	/**
	 * Indicates that the abort message should be sent once the startup confirmation is received.
	 *
	 * @private
	 * @type {boolean}
	 */
	this._sendAbortMessage = false;

	JobWorkerMediator.call(this, trackedJob);
}

inherits(JobWorkerIPCMediator, JobWorkerMediator);

JobWorkerIPCMediator.prototype.execWorker = function() {
	return util.promiseTry(function() {
		var args = this._buildForkArgs();
		var opts = this._buildForkOpts();

		this.childProcess = this.trackedJob.manager.middleware.runSyncMiddleware(
			constants.MIDDLEWARE_FORK_JOB_PROCESS,
			this.trackedJob,
			[this.trackedJob.manager.options.forkModulePath, args, opts],
			fork
		);

		this.processId = String(this.childProcess.pid);
		this.addChildListeners();
	}.bind(this));
};

/**
 * Build the args for the fork call.
 *
 * @private
 * @returns {string[]}
 */
JobWorkerIPCMediator.prototype._buildForkArgs = function() {
	return this.trackedJob.manager.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_BUILD_FORK_ARGS,
		this.trackedJob,
		[this.trackedJob],
		function(trackedJob) {
			return [
				'--useIPC',
				'--jobName=' + trackedJob.jobConfig.jobName,
				'--jobId=' + trackedJob.jobId
			];
		}
	);
};

/**
 * Build the args for the fork call.
 *
 * @private
 * @returns {object}
 */
JobWorkerIPCMediator.prototype._buildForkOpts = function() {
	return this.trackedJob.manager.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_BUILD_FORK_OPTS,
		this.trackedJob,
		[this.trackedJob],
		function() {
			return {};
		}
	);
};

/**
 * Add event listeners to ChildProcess.
 *
 * @protected
 */
JobWorkerIPCMediator.prototype.addChildListeners = function() {
	// Bind listener callbacks to allow clean removal
	['handleChildMessage', 'handleChildDisconnect', 'handleChildError', 'handleChildClose', 'handleChildExit']
		.forEach(function(method) {
			if (!this.hasOwnProperty(method)) {
				this[method] = this[method].bind(this);
			}
		}.bind(this));

	this.childProcess
		.on('message', this.handleChildMessage)
		.on('disconnect', this.handleChildDisconnect)
		.on('error', this.handleChildError)
		.on('close', this.handleChildClose)
		.on('exit', this.handleChildExit);
};

/**
 * Called when the job sends the 'startup' message signaling it
 * has successfully initialized and is ready for the params payload.
 *
 * @protected
 */
JobWorkerIPCMediator.prototype.handleStartupConfirmation = function() {
	JobWorkerMediator.prototype.handleStartupConfirmation.call(this);

	// If was aborted before receiving the startup confirmation,
	// send the abort message now that we know the child process
	// is listening for messages.
	if (this._sendAbortMessage) {
		this.sendAbortMessage();
		return;
	}

	this.childProcess.send({
		type: constants.JOB_MESSAGE_PAYLOAD,
		options: this.trackedJob.manager.options,
		job: {
			jobId: this.trackedJob.jobId,
			jobName: this.trackedJob.jobConfig.jobName,
			params: this.trackedJob.params
		}
	}, function(err) {
		if (err) {
			this.handleError(
				new errors.JobForkError(
					'Job failed to send the IPC payload',
					this.trackedJob.jobConfig.jobName,
					this.trackedJob.jobId,
					{ error: err }
				)
			);
		}
	}.bind(this));
};

/**
 * Handle 'message' ChildProcess events.
 *
 * @protected
 * @param {*} message
 */
JobWorkerIPCMediator.prototype.handleChildMessage = function(message) {
	if (message) {
		switch (message.type) {
			case constants.JOB_MESSAGE_STARTUP:
				this.handleStartupConfirmation();
				break;
			case constants.JOB_MESSAGE_SUCCESS:
				this.handleSuccess(message.result);
				break;
			case constants.JOB_MESSAGE_ERROR:
				var error = message.error;
				// TODO: Shouldn't this check error.message?
				if (!(error instanceof Error)) {
					error = new errors.JobForkError(
						error.message || 'Job worker sent an error without a message',
						this.trackedJob.jobConfig.jobName,
						this.trackedJob.jobId,
						{ error: error }
					);
				}

				this.handleError(error);
				break;
			case constants.JOB_MESSAGE_PROGRESS:
				this.handleProgress(message.progress);
				break;
		}
	}
};

/**
 * Handle a 'disconnect' ChildProcess event.
 *
 * @protected
 */
JobWorkerIPCMediator.prototype.handleChildDisconnect = function() {
	this.handleError(
		new errors.JobForkError(
			'Job unexpectedly closed IPC connection',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId
		)
	);
};

/**
 * Handle a 'error' ChildProcess event.
 *
 * @protected
 * @param {Error} err
 */
JobWorkerIPCMediator.prototype.handleChildError = function(err) {
	this.handleError(
		new errors.JobForkError(
			'Job encountered an unrecoverable error',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId,
			{ error: err }
		)
	);
};

/**
 * Handle an unexpected 'close' ChildProcess event.
 *
 * @protected
 * @param {number|null} code
 * @param {string|null} signal
 */
JobWorkerIPCMediator.prototype.handleChildClose = function(code, signal) {
	this.handleError(
		new errors.JobForkError(
			'Job exited unexpectedly',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId,
			{ code: code, signal: signal }
		)
	);
};

JobWorkerIPCMediator.prototype.stopMediation = function() {
	if (this.childProcess) {
		this.childProcess
			.removeListener('message', this.handleChildMessage)
			.removeListener('disconnect', this.handleChildDisconnect)
			.removeListener('error', this.handleChildError)
			.removeListener('close', this.handleChildClose);
	}

	return JobWorkerMediator.prototype.stopMediation.apply(this, arguments);
};

/**
 * Handle an 'exit' ChildProcess event.
 *
 * @protected
 */
JobWorkerIPCMediator.prototype.handleChildExit = function() {
	this.childProcess.removeListener('exit', this.handleChildExit);
	this.handleExit();
};

JobWorkerIPCMediator.prototype.terminate = function(forceKill) {
	if (this.childProcess && this.forked && !this.exited) {
		if (forceKill) {
			this.childProcess.kill('SIGKILL');
		}
		else {
			// TODO: Send terminate message if still connected
			this.childProcess.kill('SIGTERM');
		}
	}
};

JobWorkerIPCMediator.prototype.sendAbortMessage = function() {
	// Send the message later if not started, as the child process may not be listening to messages yet.
	if (!this.started) {
		this._sendAbortMessage = true;
	}
	else if (this.childProcess && this.childProcess.connected) {
		this.childProcess.send({
			type: constants.JOB_MESSAGE_ABORT
		});
	}
};

/**
 * Intercepts forking the local child process using `require("child_process").fork`.
 *
 * @protected
 * @function forkJobProcess
 * @param {string} forkModulePath - Set from {@link HubManagerOptions#forkModulePath} and passed as first argument of `require("child_process").fork`.
 * @param {string[]} forkArgs - Created by {@link buildForkArgs} and passed as second argument of `require("child_process").fork`.
 * @param {object} forkOpts - Created by {@link buildForkOpts} and passed as third argument of `require("child_process").fork`.
 * @param {function} next
 * @this TrackedJob
 * @returns {ChildProcess}
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('forkJobProcess', function(trackedJob, next) {
 *     return next().on('message', function(message) {
 *         // Custom message handling of ChildProcess message events
 *     });
 * });
 * ```
 */

/**
 * Intercepts creation of args provided to {@link forkJobProcess}.
 *
 * @protected
 * @function buildForkArgs
 * @param {TrackedJob} trackedJob
 * @param {function} next
 * @this TrackedJob
 * @returns {string[]}
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('buildForkArgs', function(trackedJob, next) {
 *     return next().concat([
 *         '--my-custom-flag'
 *     ];
 * });
 * ```
 */

/**
 * Intercepts creation of opts provided to {@link forkJobProcess}.
 *
 * @protected
 * @function buildForkOpts
 * @param {TrackedJob} trackedJob
 * @param {function} next
 * @this TrackedJob
 * @returns {object}
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('buildForkOpts', function(trackedJob, next) {
 *     return Object.assign(next(), {
 *         env: [
 *             CUSTOM_ENV: 'my-value'
 *         ]
 *     ];
 * });
 * ```
 */
