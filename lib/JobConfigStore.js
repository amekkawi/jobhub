var constants = require('./constants');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var errors = require('./errors');

module.exports = JobConfigStore;

/**
 * @classdesc Manages registered job config.
 * @class
 */
function JobConfigStore() {
	EventEmitter.call(this);

	/**
	 * Registered job config
	 * @type {object.<string,JobConfig>}
	 * @private
	 */
	this._registered = Object.create(null);
}

// JobConfigStore extends EventEmitter
inherits(JobConfigStore, EventEmitter);

/**
 * Register a job.
 *
 * @param {string} jobName
 * @param {JobConfig|function} jobConfig
 * @returns {JobConfigStore}
 * @throws {JobAlreadyExistsError}
 * @throws {InvalidJobConfigError}
 */
JobConfigStore.prototype.registerJob = function(jobName, jobConfig) {
	if (this._registered[jobName]) {
		throw new errors.JobAlreadyExistsError(jobName);
	}

	jobConfig = util.parseJobConfig(jobName, jobConfig);

	this._registered[jobName] = jobConfig;
	this.emit(constants.EVENT_JOB_REGISTERED, jobName, jobConfig);

	return this;
};

/**
 * Register multiple jobs.
 *
 * @param {object<string,function|JobConfig>} jobConfigMap
 * @returns {JobConfigStore}
 * @throws {JobAlreadyExistsError}
 * @throws {InvalidJobConfigError}
 */
JobConfigStore.prototype.registerJobs = function(jobConfigMap) {
	Object.keys(jobConfigMap).forEach(function(jobName) {
		this.registerJob(jobName, jobConfigMap[jobName]);
	}.bind(this));

	return this;
};

/**
 * Unregister a job by name.
 *
 * Does not throw an error if a job by that name is not registered.
 *
 * @param {string} jobName
 * @returns {JobConfigStore}
 */
JobConfigStore.prototype.unregisterJob = function(jobName) {
	if (this._registered[jobName]) {
		var jobConfig = this._registered[jobName];
		delete this._registered[jobName];
		this.emit(constants.EVENT_JOB_UNREGISTERED, jobName, jobConfig);
	}
	return this;
};

/**
 * Unregister all jobs.
 *
 * @returns {JobConfigStore}
 */
JobConfigStore.prototype.unregisterAllJobs = function() {
	Object.keys(this._registered).forEach(function(jobName) {
		this.unregisterJob(jobName);
	}.bind(this));
	return this;
};

/**
 * Get the names of jobs that have been registered.
 *
 * @returns {string[]}
 */
JobConfigStore.prototype.getRegisteredJobNames = function() {
	return Object.keys(this._registered);
};

/**
 * Get the normalized config for a job, or null if the job is not registered.
 *
 * @param {string} jobName
 * @returns {JobConfig|null}
 */
JobConfigStore.prototype.getJobConfig = function(jobName) {
	return this._registered[jobName] || null;
};

/**
 * Configuration for a job.
 *
 * A job can be defined in two ways:
 *
 * 1. Just a function, which is the code that will run in the child process.
 * 2. An object that has at a minimum of a {@link JobConfig#run} function, which is the code that will run in the child process.
 *
 * @typedef {object} JobConfig
 */

/**
 * Optional. Set to `true` to only allow one instance of the job to run at a time.
 * Attempts to queue the job while one is still running will return the {@link TrackedJob} instance of the already running job.
 * This option is ignored if {@link JobConfig#uniqueKey} is set.
 *
 * @member {boolean} JobConfig#unique
 * @default false
 */

/**
 * User-defined data that can be stored with the JobConfig.
 *
 * @member {object} JobConfig#meta
 * @default {}
 */

/**
 * Set by jobhub after the job config is registered with a {@link JobConfigStore}.
 * @member {string} JobConfig#jobName
 */

/**
 * Required. This function will be executed in the child process to run the job.
 *
 * @function JobConfig#run
 * @param {JobRunArg} job
 */

/**
 * Optional. Provides a unique key used to only allow one instance of the job to run at a time for that key.
 *
 * The unique key returned must be a string, but the function can also return null/undefined to allow that job to run
 * without being unique. This function runs in the same process the {@link HubManager} is started in.
 *
 * @function JobConfig#uniqueKey
 * @param {*} params - Value provided to {@link HubManager#queueJob}.
 * @returns {void|null|String}
 */

/**
 * Optional. Validates the params value provided to {@link HubManager#queueJob}.
 * The function will receive two arguments, the params value provided to {@link HubManager#queueJob} and the
 * {@link InvalidJobParamError} constructor. The function should throw an Error
 * (preferably {@link InvalidJobParamError}) if the params are invalid. The function can return a
 * Promise to validate the params asynchronously.
 *
 * @function JobConfig#validate
 * @param {*} params
 * @param {InvalidJobParamError} InvalidJobParamError - Error constructor that should be used to throw validation errors.
 * @throws {Error|InvalidJobParamError}
 * @return {void|Promise}
 */

/**
 * Called when a job for this config is created, similar to the {@link HubManager#event:jobCreated} event.
 *
 * @see {@link HubManager#queueJob}
 * @function JobConfig#onCreate
 * @param {TrackedJob} trackedJob
 */

/**
 * Optional. This function will be executed in the {@link HubManager} process to optionally allow a job
 * to be quickly resolved/rejected without starting a child process.
 *
 * @function JobConfig#quickRun
 * @param {JobRunArg} job
 * @param {function} next - Call to skip "quickRun", continuing to "run" the worker.
 */

/**
 * Passed to {@link JobConfig#run} and {@link JobConfig#quickRun}
 * to provide information about the job and facilitate communicate progress/success/failure.
 *
 * @typedef {object} JobRunArg
 */

/**
 * The unique identifier for the job.
 *
 * @member {string} JobRunArg#jobId
 */

/**
 * The params passed to {@link HubManager#queueJob}.
 *
 * @member {*} JobRunArg#params
 */

/**
 * Call to resolve the job.
 *
 * @function JobRunArg#resolve
 * @param {*} result
 * @see {@link TrackedJob#event:jobSuccess}
 * @see {@link HubManager#event:jobSuccess}
 */

/**
 * Call to reject the job.
 *
 * @function JobRunArg#reject
 * @param {Error} error
 * @see {@link TrackedJob#event:jobFailure}
 * @see {@link HubManager#event:jobFailure}
 */

/**
 * Send progress data.
 *
 * @function JobRunArg#sendProgress
 * @param {*} progress
 * @returns {Promise} Resolves once the progress is sent, and rejects if there was an error sending the progress.
 * @see {@link TrackedJob#event:jobProgress}
 * @see {@link HubManager#event:jobProgress}
 */

/**
 * Add a listener for an abort event.
 *
 * @function JobRunArg#onAbort
 * @param {function} handler
 * @see {@link TrackedJob#abort}
 * @see {@link TrackedJob#event:jobAbort}
 */
