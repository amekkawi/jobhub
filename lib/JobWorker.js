var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var errors = require('./errors');
var constants = require('./constants');
var MiddlewareStore = require('./MiddlewareStore');
var JobConfigStore = require('./JobConfigStore');

module.exports = JobWorker;

/**
 * @classdesc Responsible for running the job in the forked worker process.
 *
 * @class
 * @augments {EventEmitter}
 * @param {string} jobId
 * @param {string} jobName
 * @param {*} params
 * @param {object|HubManagerOptions} options
 * @fires JobWorker#jobAbort
 */
function JobWorker(jobId, jobName, params, options) {
	EventEmitter.call(this);

	/**
	 * @member {string} JobWorker#jobId
	 */
	this.jobId = jobId;

	/**
	 * @member {string} JobWorker#jobName
	 */
	this.jobName = jobName;

	/**
	 * @member {*} JobWorker#params
	 */
	this.params = params;

	/**
	 * @member {HubManagerOptions} JobWorker#options
	 */
	this.options = options;

	/**
	 * Set to `true` once {@link JobWorker#start} is called and `false` once it succeeds or fails.
	 *
	 * @member {boolean} JobWorker#running
	 * @default false
	 */
	this.running = false;

	/**
	 * Set to a Promise the first time {@link JobWorker#start} is called.
	 *
	 * @member {null|Promise} JobWorker#promise
	 * @default null
	 */
	this.promise = null;

	/**
	 * @member {MiddlewareStore} JobWorker#middleware
	 */
	this.middleware = new MiddlewareStore();

	// Add built-in supported middleware
	this.middleware.addSupportedSyncTypes(this.getSupportedSyncMiddleware());

	/**
	 * @member {JobConfigStore} JobWorker#jobs
	 */
	this.jobs = new JobConfigStore();
}

// JobWorker extends EventEmitter
inherits(JobWorker, EventEmitter);

/**
 * Starts the job, loads job config, validates params and executes {@link JobConfig#run}.
 *
 * @returns {Promise}
 */
JobWorker.prototype.start = function() {
	if (this.promise) {
		return this.promise;
	}

	this.running = true;

	return this.promise = Promise.resolve()
		.then(function() {
			return this.init();
		}.bind(this))
		.then(function() {
			var jobConfig = this.jobs.getJobConfig(this.jobName);
			if (!jobConfig) {
				throw new errors.JobNotFoundError(this.jobName);
			}

			// Validate tracked job props (may be async)
			return util.validateJobParams(jobConfig, this.params)
				.then(function() {
					return new Promise(function(resolve, reject) {
						jobConfig.run(this.buildJobArg(resolve, reject));
					}.bind(this));
				}.bind(this));
		}.bind(this))
		.then(function(result) {
			this.running = false;

			return this.handleSuccess(result)
				.catch(function(caughtErr) {
					// Wrap error thrown by handleSuccess
					throw new errors.JobWorkerHandlerError(
						errors.JobWorkerHandlerError.TYPES.SUCCESS,
						result,
						caughtErr
					);
				})
				.then(function() {
					return result;
				});
		}.bind(this), function(err) {
			this.running = false;

			return this.handleError(err)
				.catch(function(caughtErr) {
					// Wrap error thrown by handleError
					throw new errors.JobWorkerHandlerError(
						errors.JobWorkerHandlerError.TYPES.ERROR,
						err,
						caughtErr
					);
				})
				.then(function() {
					throw err;
				});
		}.bind(this));
};

/**
 * Get the list of supported sync middleware types.
 *
 * @protected
 * @returns {string[]}
 */
JobWorker.prototype.getSupportedSyncMiddleware = function() {
	return [
		constants.MIDDLEWARE_WORKER_LOAD_JOB,
		constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG
	];
};

/**
 * Initialize worker options and load jobs.
 *
 * @protected
 * @returns {Promise}
 */
JobWorker.prototype.init = function() {
	return util.promiseTry(function() {
		// Parse and validate manager options
		this.options = util.parseManagerOptions(this.options, util.getDefaultManagerOptions());

		// Require custom init module, if specified
		if (this.options.initModulePath) {
			var initModule = require(this.options.initModulePath);
			if (typeof initModule.initWorker === 'function') {
				return initModule.initWorker(this);
			}
		}
	}.bind(this))
		.then(function() {
			// Load the job config
			return this.loadJob();
		}.bind(this));
};

/**
 * Load the jobs from the module specified by {@link HubManagerOptions#jobsModulePath}.
 *
 * @protected
 * @returns {Promise}
 */
JobWorker.prototype.loadJob = function() {
	return util.promiseTry(function() {
		this.middleware.runSyncMiddleware(
			constants.MIDDLEWARE_WORKER_LOAD_JOB,
			this,
			[this.jobs, this.jobName],
			function(jobStore) {
				jobStore.registerJobs(require(this.options.jobsModulePath));
			}
		);
	}.bind(this));
};

/**
 * Build the "job" argument for {@link JobConfig#run}.
 *
 * @protected
 * @param {function} resolve
 * @param {function} reject
 * @returns {JobRunArg}
 */
JobWorker.prototype.buildJobArg = function(resolve, reject) {
	return this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG,
		this,
		[
			this.jobId,
			this.params,
			resolve,
			reject,
			this.handleProgress.bind(this),
			this.once.bind(this, constants.EVENT_JOB_ABORT)
		],
		function(jobId, params, resolve, reject, sendProgress, onAbort) {
			return {
				jobId: jobId,
				params: params,
				resolve: resolve,
				reject: reject,
				sendProgress: sendProgress,
				onAbort: onAbort
			};
		}
	);
};

/**
 * Called on successful execution of the job.
 *
 * @protected
 * @param {*} result
 * @returns {Promise} Resolves once the success is handled, and rejects if there was an error handling the success.
 */
JobWorker.prototype.handleSuccess = function(result) { // eslint-disable-line no-unused-vars
	return Promise.resolve();
};

/**
 * Called when the job fails due to an error.
 *
 * @protected
 * @param {Error} err
 * @returns {Promise} Resolves once the error is handled, and rejects if there was an error handling the original error.
 */
JobWorker.prototype.handleError = function(err) { // eslint-disable-line no-unused-vars
	return Promise.resolve();
};

/**
 * Called when the job sends progress.
 *
 * @protected
 * @param {*} progress
 * @returns {Promise} Resolves once the progress is sent, and rejects if there was an error sending the progress.
 */
JobWorker.prototype.handleProgress = function(progress) { // eslint-disable-line no-unused-vars
	return Promise.resolve();
};

/**
 * Called when the JobWorker is notified of an abort.
 *
 * Emits a {@link JobWorker#event:jobAbort} only if {@link JobWorker#running} is true.
 *
 * @protected
 */
JobWorker.prototype.handleAbort = function() {
	if (this.running) {
		this._emitJobAbort();
	}
};

/**
 * Fires when the job is told to abort.
 *
 * @event JobWorker#jobAbort
 */
JobWorker.prototype._emitJobAbort = function() {
	this.emit(constants.EVENT_JOB_ABORT);
};
