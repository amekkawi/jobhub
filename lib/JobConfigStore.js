var constants = require('./constants');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var errors = require('./errors');

module.exports = JobConfigStore;

/**
 * Manages registered job config.
 *
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
