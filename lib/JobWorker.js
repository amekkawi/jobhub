var util = require('./util');
var errors = require('./errors');
var constants = require('./constants');
var MiddlewareStore = require('./MiddlewareStore');
var JobConfigStore = require('./JobConfigStore');

module.exports = JobWorker;

/**
 * Responsible for running the job in the forked worker process
 *
 * @param {string} jobId
 * @param {string} jobName
 * @param {*} params
 * @param {object|HubManager~Options} options
 * @property {string} jobId
 * @property {string} jobName
 * @property {*} params
 * @property {HubManager~Options} options
 * @property {boolean} running true once start() is called and false once it succeeds or fails
 * @property {null|Promise} promise
 * @class
 */
function JobWorker(jobId, jobName, params, options) {
	this.jobId = jobId;
	this.jobName = jobName;
	this.params = params;
	this.options = options;

	this.running = false;
	this.promise = null;

	this.middleware = new MiddlewareStore();
	this.middleware.addSupportedSyncTypes(this.getSupportedSyncMiddleware());

	this.jobs = new JobConfigStore();
}

/**
 * Starts the job, loading config, validating params and executing the "run" jobConfig handler
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
			this.handleSuccess(result);
			return result;
		}.bind(this))
		.catch(function(err) {
			this.running = false;
			this.handleError(err);
			throw err;
		}.bind(this));
};

/**
 * Get the list of supported sync middleware types
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
 * Initialize worker options and load jobs
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
 * Load the jobs from the module specified by 'jobsModulePath'
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
 * Build the "job" argument for the job config's "run" method
 *
 * @protected
 * @param {function} resolve
 * @param {function} reject
 * @returns {JobConfig_JobArg}
 */
JobWorker.prototype.buildJobArg = function(resolve, reject) {
	return this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG,
		this,
		[this.jobId, this.params, resolve, reject, this.handleProgress.bind(this)],
		function(jobId, params, resolve, reject, sendProgress) {
			return {
				jobId: jobId,
				params: params,
				resolve: resolve,
				reject: reject,
				sendProgress: sendProgress
			};
		}
	);
};

/**
 * Called on successful execution of the job
 *
 * @protected
 * @param {*} result
 * @param {function} [errback] - Optional errback called after handling the event, optionally with an error as first arg
 */
JobWorker.prototype.handleSuccess = function(result, errback) {
	errback && errback();
};

/**
 * Called when the job fails due to an error
 *
 * @protected
 * @param {Error} err
 * @param {function} [errback] - Optional errback called after handling the event, optionally with an error as first arg
 */
JobWorker.prototype.handleError = function(err, errback) {
	errback && errback();
};

/**
 * Called when the job sends progress
 *
 * @protected
 * @param {*} progress
 * @returns {Promise} Resolves once the progress is sent, and rejects if there was an error sending the progress
 */
JobWorker.prototype.handleProgress = function(progress) { // eslint-disable-line no-unused-vars
	return Promise.resolve();
};
