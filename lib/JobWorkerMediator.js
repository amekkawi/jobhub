var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var constants = require('./constants');
var util = require('./util');
var errors = require('./errors');

module.exports = JobWorkerMediator;

/**
 * Mediates communication with the tracked job's worker process.
 *
 * @class
 * @augments EventEmitter
 * @param {TrackedJob} trackedJob
 * @property {TrackedJob} trackedJob
 * @property {boolean} started
 * @property {boolean} settled
 * @property {boolean} exited
 * @fires JobWorkerMediator#event:JOB_PROGRESS
 * @fires JobWorkerMediator#event:JOB_SUCCESS
 * @fires JobWorkerMediator#event:JOB_FAILURE
 * @fires JobWorkerMediator#event:JOB_EXIT
 */
function JobWorkerMediator(trackedJob) {
	EventEmitter.call(this);
	this.trackedJob = trackedJob;
	this.started = false;
	this.settled = false;
	this.exited = false;
}

// JobWorkerMediator extends EventEmitter
inherits(JobWorkerMediator, EventEmitter);

/**
 * Execute and monitor the job's worker process.
 *
 * @returns {Promise}
 */
JobWorkerMediator.prototype.startWorker = function() {
	return util.promiseTry(function() {
		this.initStartupTimeout();
		return this.execWorker();
	}.bind(this))
		.then(function() {
			this.started = true;
		}.bind(this), function(err) {
			this.stopMediation();
			throw err;
		}.bind(this));
};

/**
 * Stop mediating communication with the job's worker process and cleanup any timers.
 *
 * @returns {JobWorkerMediator}
 */
JobWorkerMediator.prototype.stopMediation = function() {
	clearTimeout(this._startupTimerId);
	return this;
};

/**
 * Terminate the job's worker process.
 *
 * @abstract
 * @param {boolean} [forceKill=false]
 */
JobWorkerMediator.prototype.terminate = function(forceKill) { // eslint-disable-line no-unused-vars
	throw new Error('JobWorkerMediator#terminate is abstract and must be overridden');
};

/**
 * Execute the worker process and begin mediating communication with it.
 *
 * @abstract
 * @protected
 * @returns {*|Promise} Resolves immediately after the process is spawned.
 */
JobWorkerMediator.prototype.execWorker = function() {
	throw new Error('JobWorkerMediator#execWorker is abstract and must be overridden');
};

/**
 * Check if a timeout for the worker's startup should begin.
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
 * Begin the timer for the worker's startup timeout.
 *
 * @protected
 * @param {number} timeout - Timeout period in milliseconds.
 */
JobWorkerMediator.prototype.beginStartupTimeout = function(timeout) {
	clearTimeout(this._startupTimerId);
	this._startupTimerId = setTimeout(
		this.handleStartupTimeout.bind(this),
		timeout
	).unref();
};

/**
 * Called when the job's worker process confirms it has successfully initialized.
 *
 * This will stop the startup timeout, if one is running.
 *
 * @protected
 */
JobWorkerMediator.prototype.handleStartupConfirmation = function() {
	clearTimeout(this._startupTimerId);
};

/**
 * Called when the job's worker process reports 'success'.
 *
 * @protected
 * @param {*} result
 * @fires JobWorkerMediator#event:JOB_PROGRESS
 */
JobWorkerMediator.prototype.handleSuccess = function(result) {
	this.settled = true;
	this.stopMediation();
	this.emit(constants.EVENT_JOB_SUCCESS, result);
};

/**
 * Called when the job's worker process sends its 'progress'.
 *
 * @protected
 * @param {*} progress
 * @fires JobWorkerMediator#event:JOB_PROGRESS
 */
JobWorkerMediator.prototype.handleProgress = function(progress) {
	this.emit(constants.EVENT_JOB_PROGRESS, progress);
};

/**
 * Handle an error.
 *
 * @protected
 * @param {Error} error
 * @fires JobWorkerMediator#event:JOB_FAILURE
 */
JobWorkerMediator.prototype.handleError = function(error) {
	this.settled = true;
	this.stopMediation();
	this.emit(constants.EVENT_JOB_FAILURE, error);
};

/**
 * Handle the job's worker process exiting.
 *
 * @protected
 * @fires JobWorkerMediator#event:JOB_EXIT
 */
JobWorkerMediator.prototype.handleExit = function() {
	this.exited = true;
	this.emit(constants.EVENT_JOB_EXIT);
};

/**
 * Handle the timeout for 'startup' being reached.
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

/**
 * @event JobWorkerMediator#event:JOB_PROGRESS
 * @type {object|*}
 */

/**
 * @event JobWorkerMediator#event:JOB_SUCCESS
 * @type {object|*|null|undefined}
 */

/**
 * @event JobWorkerMediator#event:JOB_FAILURE
 * @type {Error}
 */

/**
 * @event JobWorkerMediator#event:JOB_EXIT
 */
