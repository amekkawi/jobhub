var util = require('./util');
var JobConfigStore = require('./JobConfigStore');

module.exports = JobWorker;

/**
 * @typedef {object} JobRunArg
 * @property {string} jobId
 * @property {*} params
 * @property {function} resolve
 * @property {function} reject
 * @property {function} sendProgress
 */

/**
 * Responsible for running the job in the forked worker process
 *
 * @param {string} jobId
 * @param {string} jobName
 * @param {*} params
 * @param {object|HubManagerOptions} options
 * @property {string} jobId
 * @property {string} jobName
 * @property {*} params
 * @property {HubManagerOptions} options
 * @property {boolean} running true once start() is called and false once it succeeds or fails
 * @class
 */
function JobWorker(jobId, jobName, params, options) {
	this.jobId = jobId;
	this.jobName = jobName;
	this.params = params;
	this.options = options;

	this.running = false;
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
	return this.promise = this.init()
		.then(function() {
			var jobConfig = this.jobs.getJobConfig(this.jobName);
			if (!jobConfig) {
				throw new Error('Job worker did not load a job handler for ' + JSON.stringify(this.jobName));
			}

			// Validate tracked job props (may be async)
			return Promise.resolve(util.validateJobParams(jobConfig, this.params))
				.then(function() {
					return new Promise(function(resolve, reject) {
						jobConfig.run(this.buildJobArg(resolve, reject));
					}.bind(this));
				}.bind(this));
		}.bind(this))
		.then(function(result) {
			this.running = false;
			this.handleSuccess(result);
		}.bind(this))
		.catch(function(err) {
			this.running = false;
			this.handleError(err);
			throw err;
		}.bind(this));
};

/**
 * (Internal method)
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
		if (this.options.forkInitModulePath) {
			require(this.options.forkInitModulePath);
		}

		// Load the job config
		return Promise.resolve(this.loadJobs());
	}.bind(this));
};

/**
 * (Internal method)
 * Load the jobs from the module specified by 'jobsModulePath'
 *
 * @protected
 * @throws {JobAlreadyExistsError}
 * @throws {InvalidJobConfigError}
 * @returns {*|Promise}
 */
JobWorker.prototype.loadJobs = function() {
	this.jobs.registerJobs(require(this.options.jobsModulePath));
	return null;
};

/**
 * (Internal method)
 * Build the "job" argument for the job config's "run" method
 *
 * @protected
 * @param {function} resolve
 * @param {function} reject
 * @returns {JobRunArg}
 */
JobWorker.prototype.buildJobArg = function(resolve, reject) {
	return {
		jobId: this.jobId,
		params: this.params,
		resolve: resolve,
		reject: reject,
		sendProgress: this.handleProgress.bind(this)
	};
};

/**
 * (Internal method)
 * TODO
 *
 * @protected
 * @param {*} result
 * @param {function} [errback]
 */
JobWorker.prototype.handleSuccess = function(result, errback) {
	errback();
};

/**
 * (Internal method)
 * TODO
 *
 * @protected
 * @param {Error} err
 * @param {function} [errback]
 */
JobWorker.prototype.handleError = function(err, errback) {
	errback();
};

/**
 * (Internal method)
 * TODO
 *
 * @protected
 * @param {*} progress
 * @param {function} [errback]
 */
JobWorker.prototype.handleProgress = function(progress, errback) {
	errback();
};
