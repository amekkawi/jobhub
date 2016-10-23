var fork = require('child_process').fork;
var inherits = require('util').inherits;
var util = require('./util');
var constants = require('./constants');
var errors = require('./errors');
var JobWorkerMediator = require('./JobWorkerMediator');

module.exports = JobWorkerIPCMediator;

/**
 * Manages a job's forked process during it's normal life cycle
 *
 * @param {TrackedJob} trackedJob
 * @param {function} progress - Callback for progress messages
 * @param {function} resolve - Callback for success
 * @param {function} reject - Callback for failure
 * @property {TrackedJob} trackedJob
 * @property {ChildProcess|null} childProcess
 * @class
 */
function JobWorkerIPCMediator(trackedJob, progress, resolve, reject) {
	this.childProcess = null;
	JobWorkerMediator.call(this, trackedJob, progress, resolve, reject);
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
	}.bind(this));
};

/**
 * Build the args for the fork call
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
 * Build the args for the fork call
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

JobWorkerIPCMediator.prototype.addListeners = function() {
	// Bind listener callbacks to allow clean removal
	['handleChildMessage', 'handleChildDisconnect', 'handleChildError', 'handleChildClose']
		.forEach(function(method) {
			if (!this.hasOwnProperty(method)) {
				this[method] = this[method].bind(this);
			}
		}.bind(this));

	this.childProcess
		.on('message', this.handleChildMessage)
		.on('disconnect', this.handleChildDisconnect)
		.on('error', this.handleChildError)
		.on('close', this.handleChildClose);
};

JobWorkerIPCMediator.prototype.removeListeners = function() {
	this.childProcess
		.removeListener('message', this.handleChildMessage)
		.removeListener('disconnect', this.handleChildDisconnect)
		.removeListener('error', this.handleChildError)
		.removeListener('close', this.handleChildClose);
};

/**
 * Called when the job sends the 'startup' message signalling it
 * has successfully initialized and is ready for the params payload
 *
 * @protected
 */
JobWorkerIPCMediator.prototype.handleStartupConfirmation = function() {
	JobWorkerMediator.prototype.handleStartupConfirmation.call(this);

	this.childProcess.send({
		type: constants.JOB_MESSAGE_PAYLOAD,
		options: this.trackedJob.manager.options,
		job: {
			jobId: this.trackedJob.jobId,
			jobName: this.trackedJob.jobConfig.jobName,
			params: this.trackedJob.params
		}
	});
};

/**
 * Handle 'message' ChildProcess events
 *
 * @protected
 * @param {*} message
 */
JobWorkerMediator.prototype.handleChildMessage = function(message) {
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
				if (!(error instanceof Error)) {
					error = new errors.JobForkError(
						error.message || 'Job worker sent an error without a message',
						this.trackedJob.jobName,
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
 * Handle a 'disconnect' ChildProcess event
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
 * Handle a 'error' ChildProcess event
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
 * Handle an unexpected 'close' ChildProcess event
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
