var util = require('./util');
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
}

/**
 * Execute and monitor the job's worker process
 *
 * @returns {Promise}
 */
JobWorkerMediator.prototype.startWorker = function() {
	return util.promiseTry(this.execWorker.bind(this))
		.then(function() {
			try {
				this.addListeners();
				this.initStartupTimeout();
			}
			catch (err) {
				this.stopMediation();
				throw err;
			}
		}.bind(this));
};

/**
 * Stop listening to the worker's communication and cleanup any timers
 *
 * @returns {JobWorkerMediator} this
 */
JobWorkerMediator.prototype.stopMediation = function() {
	clearTimeout(this._startupTimerId);
	this.removeListeners();
	return this;
};

/**
 * Execute the worker process
 *
 * @abstract
 * @protected
 * @returns {*|Promise} Resolves immediately after the process is spawned
 */
JobWorkerMediator.prototype.execWorker = function() {
	throw new Error('JobWorkerMediator#execWorker is abstract and must be overridden');
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
 * Check if a timeout for the worker's startup should begin
 *
 * @protected
 */
JobWorkerMediator.prototype.initStartupTimeout = function() {
	var workerStartupTimeout = this.trackedJob.manager.options.workerStartupTimeout;
	if (workerStartupTimeout > 0) {
		this.beginStartupTimeout(workerStartupTimeout);
	}
};

/**
 * Begin the timer for the worker's startup timeout
 *
 * @protected
 * @param {number} timeout - Timeout period in milliseconds
 */
JobWorkerMediator.prototype.beginStartupTimeout = function(timeout) {
	clearTimeout(this._startupTimerId);
	this._startupTimerId = setTimeout(
		this.handleStartupTimeout.bind(this),
		timeout
	).unref();
};

/**
 * Called when the job's worker process confirms it has successfully initialized
 *
 * This will stop the startup timeout, if one is running.
 *
 * @protected
 */
JobWorkerMediator.prototype.handleStartupConfirmation = function() {
	clearTimeout(this._startupTimerId);
};

/**
 * Called when the job's worker process reports 'success'
 *
 * Calls the original "resolve" callback
 *
 * @protected
 * @param {*} result
 */
JobWorkerMediator.prototype.handleSuccess = function(result) {
	this.stopMediation();
	this._resolve(result);
};

/**
 * Called when the job's worker process sends its 'progress'
 *
 * Calls the original "progress" callback
 *
 * @protected
 * @param {*} progress
 */
JobWorkerMediator.prototype.handleProgress = function(progress) {
	this._progress(progress);
};

/**
 * Handle an error
 *
 * Calls the original "reject" callback
 *
 * @protected
 * @param {Error} error
 */
JobWorkerMediator.prototype.handleError = function(error) {
	this.stopMediation();
	this._reject(error);
};

/**
 * Handle the timeout for 'startup' being reached
 *
 * @protected
 */
JobWorkerMediator.prototype.handleStartupTimeout = function() {
	this.handleError(
		new errors.JobForkError(
			'Job took too long to send a start confirmation message',
			this.trackedJob.jobConfig.jobName,
			this.trackedJob.jobId
		)
	);
};