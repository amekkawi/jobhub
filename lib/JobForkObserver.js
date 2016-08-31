var constants = require('./constants');
var errors = require('./errors');

module.exports = JobForkObserver;

/**
 * Manages a job's forked process during it's normal life cycle
 *
 * @param {TrackedJob} trackedJob
 * @param {function} progress - Callback for progress messages
 * @param {function} resolve - Callback for success
 * @param {function} reject - Callback for failure
 * @property {TrackedJob} trackedJob
 * @class
 */
function JobForkObserver(trackedJob, progress, resolve, reject) {
	this.trackedJob = trackedJob;
	this._childProcess = trackedJob.childProcess;
	this._progress = progress;
	this._resolve = resolve;
	this._reject = reject;

	// Auto bind methods
	Object.keys(JobForkObserver.prototype)
		.forEach(function(method) {
			this[method] = JobForkObserver.prototype[method].bind(this);
		}.bind(this));

	this._startListening();

	var workerStartupTimeout = trackedJob.manager.options.workerStartupTimeout;
	if (workerStartupTimeout > 0) {
		this._startupTimerId = setTimeout(
			this.handleStartupTimeout.bind(this),
			workerStartupTimeout
		).unref();
	}
}

/**
 * Bind event listeners to the child process
 *
 * @private
 */
JobForkObserver.prototype._startListening = function() {
	this._childProcess.on('message', this.handleMessage);
	this._childProcess.on('disconnect', this.handleDisconnect);
	this._childProcess.on('error', this.handleError);
	this._childProcess.on('close', this.handleClose);
};

/**
 * Unbind event listeners from the child process
 *
 * @private
 */
JobForkObserver.prototype._stopListening = function() {
	clearTimeout(this._startupTimerId);
	this._childProcess.removeListener('message', this.handleMessage);
	this._childProcess.removeListener('disconnect', this.handleDisconnect);
	this._childProcess.removeListener('error', this.handleError);
	this._childProcess.removeListener('close', this.handleClose);
};

/**
 * Called when the job sends the 'startup' message signalling it
 * has successfully initialized and is ready for the params payload
 */
JobForkObserver.prototype.receivedStartup = function() {
	clearTimeout(this._startupTimerId);
	this._childProcess.send({
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
 * Called when the job sends the 'success' message
 *
 * @param {*} result
 */
JobForkObserver.prototype.receivedSuccess = function(result) {
	this._stopListening();
	this._resolve(result);
};

/**
 * Called when the job sends a 'progress' message
 *
 * @param {*} progress
 */
JobForkObserver.prototype.receivedProgress = function(progress) {
	this._progress(progress);
};

/**
 * Called when the job explicitly sends an 'error' message either by
 * the JobConfig#run or if an uncaught error was thrown.
 *
 * @param {object} error
 */
JobForkObserver.prototype.receivedError = function(error) {
	if (!(error instanceof Error)) {
		error = new errors.JobForkError(
			error.message || 'Job worker sent an error without a message',
			this.trackedJob.jobName,
			this.trackedJob.jobId,
			{ error: error }
		);
	}

	this._stopListening();
	this._reject(error);
};

/**
 * Handle a failure detected by the ForkObserver,
 * such as a ChildProcess 'error' or 'exit' event
 * or the 'startup' timeout being reached
 *
 * @param {Error} error
 */
JobForkObserver.prototype.handleFailure = function(error) {
	this._stopListening();
	this._reject(error);
};

/**
 * Handle 'message' ChildProcess events
 *
 * @param {*} message
 */
JobForkObserver.prototype.handleMessage = function(message) {
	if (message) {
		switch (message.type) {
			case constants.JOB_MESSAGE_STARTUP:
				this.receivedStartup();
				break;
			case constants.JOB_MESSAGE_SUCCESS:
				this.receivedSuccess(message.result);
				break;
			case constants.JOB_MESSAGE_ERROR:
				this.receivedError(message.error);
				break;
			case constants.JOB_MESSAGE_PROGRESS:
				this.receivedProgress(message.progress);
				break;
		}
	}
};

/**
 * Handle the timeout for 'startup' being reached
 *
 * Creates an error and calls handleFailure
 */
JobForkObserver.prototype.handleStartupTimeout = function() {
	this.handleFailure(
		new errors.JobForkError(
			'Job took too long to send a start confirmation message',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId
		)
	);
};

/**
 * Handle a 'disconnect' ChildProcess event
 *
 * Creates an error and calls handleFailure
 */
JobForkObserver.prototype.handleDisconnect = function() {
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
JobForkObserver.prototype.handleError = function(err) {
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
JobForkObserver.prototype.handleClose = function(code, signal) {
	this.handleFailure(
		new errors.JobForkError(
			'Job exited unexpectedly',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId,
			{ code: code, signal: signal }
		)
	);
};
