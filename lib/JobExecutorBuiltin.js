var inherits = require('util').inherits;
var util = require('./util');
var errors = require('./errors');
var constants = require('./constants');
var JobExecutor = require('./JobExecutor');

module.exports = JobExecutorBuiltin;

/**
 * Configuration options for {@link JobExecutorBuiltin}.
 * @typedef {object} JobExecutorBuiltinOptions
 */

/**
 * Maximum number of jobs that will be run concurrently. Set to 0 to allow unlimited concurrently running jobs.
 * @member {number} JobExecutorBuiltinOptions#maxConcurrent
 * @default 0
 */

/**
 * @classdesc Manages running jobs that have been queued using {@link HubManager#queueJob}.
 *
 * @class
 * @augments JobExecutor
 * @param {JobExecutorBuiltinOptions} options
 * @param {HubManager} manager
 */
function JobExecutorBuiltin(options, manager) {
	JobExecutor.call(this, options, manager);

	/**
	 * Number of running jobs.
	 *
	 * @private
	 * @member {number} JobExecutorBuiltin#_runningCount
	 */
	this._runningCount = 0;

	/**
	 * Jobs waiting to run.
	 *
	 * @private
	 * @member {TrackedJob[]} JobExecutorBuiltin#_queue
	 */
	this._queue = [];

	/**
	 * Indicates if a (throttled) capacity check has already been queued.
	 *
	 * @private
	 * @member {boolean} JobExecutorBuiltin#_checkingForCapacity
	 */
	this._checkingForCapacity = false;
}

inherits(JobExecutorBuiltin, JobExecutor);

/**
 * Add a tracked job to be run.
 *
 * @param {TrackedJob} trackedJob
 */
JobExecutorBuiltin.prototype.add = function(trackedJob) {
	this._queue.push(trackedJob);
	this._checkForCapacity();
};

/**
 * Get detail about queued and running jobs.
 *
 * Returns:
 * * `maxConcurrent` - Maximum concurrent jobs that can run.
 * * `runningCount` - Number of running jobs.
 * * `queuedCount` - Number of jobs waiting to run.
 *
 * @returns {{ maxConcurrent: number, runningCount: number, queuedCount: number }}
 */
JobExecutorBuiltin.prototype.getStatus = function() {
	return {
		maxConcurrent: this.options.maxConcurrent,
		queuedCount: this._queue.length,
		runningCount: this._runningCount
	};
};

/**
 * Check for capacity to run more jobs. This check is throttled using `setImmediate`.
 *
 * @private
 */
JobExecutorBuiltin.prototype._checkForCapacity = function() {
	if (!this._checkingForCapacity) {
		this._checkingForCapacity = true;

		// Use setImmediate to throttle synchronously adding multiple jobs
		setImmediate(function() {
			this._checkingForCapacity = false;
			this._runToCapacity();
		}.bind(this));
	}
};

/**
 * Run jobs until the capacity is reached.
 *
 * @private
 */
JobExecutorBuiltin.prototype._runToCapacity = function() {
	var maxCurrent = this.options.maxConcurrent;
	while (this._queue.length && (maxCurrent <= 0 || this._runningCount < maxCurrent)) {
		var trackedJob = this._queue.shift();

		// Only run if it has no promise, meaning that run has not already been called.
		if (!trackedJob.promise) {
			this._runningCount++;

			var onSettle = function cb(trackedJob) {
				trackedJob.removeListener(constants.EVENT_JOB_SUCCESS, cb);
				trackedJob.removeListener(constants.EVENT_JOB_FAILURE, cb);

				this._runningCount--;
				this._checkForCapacity();
			}.bind(this, trackedJob);

			trackedJob.on(constants.EVENT_JOB_SUCCESS, onSettle);
			trackedJob.on(constants.EVENT_JOB_FAILURE, onSettle);

			trackedJob.run();
		}
	}
};

/**
 * Parse the JobExecutorBuiltin's options. Called by {@link HubManager}.
 *
 * @static
 * @param {JobExecutorBuiltinOptions} options
 * @param {JobExecutorBuiltinOptions} defaultOptions
 * @returns {JobExecutorBuiltinOptions}
 */
JobExecutorBuiltin.parseOptions = function(options, defaultOptions) {
	options = util.extendDefaultOptions(options, defaultOptions);

	if (typeof options.maxConcurrent !== 'number' || !isFinite(options.maxConcurrent)) {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "jobExecutorOptions.maxConcurrent" option must be a number',
			'jobExecutorOptions.maxConcurrent'
		);
	}

	options.maxConcurrent = Math.max(0, options.maxConcurrent);

	return options;
};

/**
 * Get the default options for the JobExecutorBuiltin. Called by {@link HubManager}.
 *
 * @static
 * @returns {JobExecutorBuiltinOptions}
 */
JobExecutorBuiltin.getDefaultOptions = function() {
	return {
		maxConcurrent: 0
	};
};
