var constants = require('./constants');
var errors = require('./errors');

module.exports = JobWorkerMediator;

/**
 * Mediates communication with the tracked job's worker process
 *
 * @param {TrackedJob} trackedJob
 * @param {function} progress - Callback for progress messages
 * @param {function} resolve - Callback for success
 * @param {function} reject - Callback for failure
 * @property {TrackedJob} trackedJob
 * @class
 */
function JobWorkerMediator(trackedJob, progress, resolve, reject) {
	this.trackedJob = trackedJob;
	this._progress = progress;
	this._resolve = resolve;
	this._reject = reject;
	this._started = false;
}

/**
 * Execute and monitor the job's worker process
 *
 * @returns {Promise}
 */
JobWorkerMediator.prototype.startWorker = function() {
	this._started = true;
	return this.execWorker()
		.then(function() {
			if (this._started) {
				this.addListeners();
				this.beginStartupTimeout();
			}
		}.bind(this));
};

/**
 * Stop listening to the worker's communication
 *
 * @returns {JobWorkerMediator} this
 */
JobWorkerMediator.prototype.stopMediation = function() {
	if (this._started) {
		this._started = false;
		clearTimeout(this._startupTimerId);
		this.removeListeners();
	}
	return this;
};

/**
 * Execute the worker process
 *
 * @abstract
 * @protected
 * @returns {Promise} Resolves immediately after the process is spawned
 */
JobWorkerMediator.prototype.execWorker = function() {
	return Promise.reject(new Error('JobWorkerMediator#execWorker is abstract and must be overridden'));
};

/**
 * Add listeners for mediating communication with the worker,
 * called by {@link JobWorkerMediator#startWorker}
 *
 * @abstract
 * @protected
 */
JobWorkerMediator.prototype.addListeners = function() {
	throw new Error('JobWorkerMediator#addListeners is abstract and must be overridden');
};

/**
 * Remove listeners for mediating communication with the worker,
 * called by {@link JobWorkerMediator#stopMediation}
 *
 * @abstract
 * @protected
 */
JobWorkerMediator.prototype.removeListeners = function() {
	throw new Error('JobWorkerMediator#removeListeners is abstract and must be overridden');
};

/**
 * Begin the timer for the worker's startup timeout
 *
 * @protected
 */
JobWorkerMediator.prototype.beginStartupTimeout = function() {
	var workerStartupTimeout = this.trackedJob.manager.options.workerStartupTimeout;
	if (workerStartupTimeout > 0) {
		this._startupTimerId = setTimeout(
			this.handleStartupTimeout.bind(this),
			workerStartupTimeout
		).unref();
	}
};

/**
 * Called when the job sends the 'startup' message signalling it
 * has successfully initialized
 *
 * @protected
 */
JobWorkerMediator.prototype.receivedStartup = function() {
	clearTimeout(this._startupTimerId);
};

/**
 * Called when the job sends the 'success' message
 *
 * @protected
 * @param {*} result
 */
JobWorkerMediator.prototype.receivedSuccess = function(result) {
	this.stopMediation();
	this._resolve(result);
};

/**
 * Called when the job sends a 'progress' message
 *
 * @protected
 * @param {*} progress
 */
JobWorkerMediator.prototype.receivedProgress = function(progress) {
	this._progress(progress);
};

/**
 * Called when the job explicitly sends an 'error' message either by
 * the JobConfig#run or if an uncaught error was thrown.
 *
 * @protected
 * @param {object} error
 */
JobWorkerMediator.prototype.receivedError = function(error) {
	if (!(error instanceof Error)) {
		error = new errors.JobForkError(
			error.message || 'Job worker sent an error without a message',
			this.trackedJob.jobName,
			this.trackedJob.jobId,
			{ error: error }
		);
	}

	this.stopMediation();
	this._reject(error);
};

/**
 * Handle a failure detected by the mediator, such as failing to exec the
 * worker process or the 'startup' timeout being reached
 *
 * @protected
 * @param {Error} error
 */
JobWorkerMediator.prototype.handleFailure = function(error) {
	this.stopMediation();
	this._reject(error);
};

/**
 * Handle the timeout for 'startup' being reached
 *
 * Creates an error and calls handleFailure
 *
 * @protected
 */
JobWorkerMediator.prototype.handleStartupTimeout = function() {
	this.handleFailure(
		new errors.JobForkError(
			'Job took too long to send a start confirmation message',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId
		)
	);
};
