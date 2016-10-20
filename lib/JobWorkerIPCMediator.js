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
	JobWorkerMediator.call(this, trackedJob, progress, resolve, reject);

	// Auto bind methods
	Object.keys(JobWorkerIPCMediator.prototype)
		.forEach(function(method) {
			this[method] = JobWorkerIPCMediator.prototype[method].bind(this);
		}.bind(this));
}

inherits(JobWorkerIPCMediator, JobWorkerMediator);

JobWorkerIPCMediator.prototype.execWorker = function() {
	return util.promiseTry(function() {
		var args = this._buildForkArgs();
		var opts = this._buildForkOpts();
		this.childProcess = this.trackedJob.manager.middleware.runSyncMiddleware(
			constants.MIDDLEWARE_FORK_JOB_PROCESS,
			this,
			[this.trackedJob.manager.options.forkModulePath, args, opts],
			fork
		);
	});
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
		this,
		[this],
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
		this,
		[this],
		function() {
			return {};
		}
	);
};

JobWorkerIPCMediator.prototype.addListeners = function() {
	// Bind listener callbacks to allow clean removal
	['handleMessage', 'handleDisconnect', 'handleError', 'handleClose']
		.forEach(function(method) {
			if (!this.hasOwnProperty(method)) {
				this[method] = this[method].bind(this);
			}
		}.bind(this));

	this.childProcess
		.on('message', this.handleMessage)
		.on('disconnect', this.handleDisconnect)
		.on('error', this.handleError)
		.on('close', this.handleClose);
};

JobWorkerIPCMediator.prototype.removeListeners = function() {
	this.childProcess
		.removeListener('message', this.handleMessage)
		.removeListener('disconnect', this.handleDisconnect)
		.removeListener('error', this.handleError)
		.removeListener('close', this.handleClose);
};

/**
 * Called when the job sends the 'startup' message signalling it
 * has successfully initialized and is ready for the params payload
 */
JobWorkerIPCMediator.prototype.receivedStartup = function() {
	JobWorkerMediator.prototype.receivedStartup.call(this);

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
 * Handle a 'disconnect' ChildProcess event
 *
 * Creates an error and calls handleFailure
 */
JobWorkerIPCMediator.prototype.handleDisconnect = function() {
	this.handleFailure(
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
 * Creates an error and calls handleFailure
 *
 * @param {Error} err
 */
JobWorkerIPCMediator.prototype.handleError = function(err) {
	this.handleFailure(
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
 * Creates an error and calls handleFailure
 *
 * @param {number|null} code
 * @param {string|null} signal
 */
JobWorkerIPCMediator.prototype.handleClose = function(code, signal) {
	this.handleFailure(
		new errors.JobForkError(
			'Job exited unexpectedly',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId,
			{ code: code, signal: signal }
		)
	);
};
