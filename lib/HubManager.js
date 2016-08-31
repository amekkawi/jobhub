var createUUID = require('uuid').v4;
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var constants = require('./constants');
var util = require('./util');
var errors = require('./errors');
var TrackedJob = require('./TrackedJob');
var JobConfigStore = require('./JobConfigStore');
var MiddlewareStore = require('./MiddlewareStore');

module.exports = HubManager;

/**
 * Manages lifecyle of jobs
 *
 * @param {HubManagerOptions} [options]
 * @property {HubManagerOptions} options
 * @property {JobConfigStore} jobs
 * @property {MiddlewareStore} middleware
 * @class
 */
function HubManager(options) {
	EventEmitter.call(this);

	// Create cleaned version of options
	this.options = util.parseManagerOptions(options, util.getDefaultManagerOptions());

	/**
	 * Lookup for checking uniqueness (jobName -> uniqueKey -> TrackedJob)
	 * @type {object.<string,object.<string,TrackedJob>>}
	 * @private
	 */
	this._trackedUniqueLookup = Object.create(null);

	/**
	 * Lookup for jobs by their ID
	 * @type {object.<string,TrackedJob>}
	 * @private
	 */
	this._trackedByJobId = Object.create(null);

	/**
	 * Queue of jobs that have completed and will be forced to terminate after a timeout
	 * @type {TrackedJob[]}
	 * @private
	 */
	this._terminationQueue = [];

	this.middleware = new MiddlewareStore();
	this.middleware.addSupportedSyncTypes([
		constants.MIDDLEWARE_LOAD_JOBS,
		constants.MIDDLEWARE_CREATE_JOB,
		constants.MIDDLEWARE_FORK_JOB_PROCESS,
		constants.MIDDLEWARE_BUILD_FORK_ARGS,
		constants.MIDDLEWARE_BUILD_FORK_OPTS,
		constants.MIDDLEWARE_OBSERVE_WORKER_PROCESS
	]);

	this.jobs = new JobConfigStore();

	this.jobs.on('JOB_REGISTERED', function(jobName) {
		this._trackedUniqueLookup[jobName] = Object.create(null);
	}.bind(this));

	this.jobs.on('JOB_UNREGISTERED', function(jobName) {
		delete this._trackedUniqueLookup[jobName];
	}.bind(this));

	this._loadJobs();
}

// HubManager extends EventEmitter
inherits(HubManager, EventEmitter);

/**
 * Load the jobs from the module specified by 'jobsModulePath'
 *
 * @private
 * @throws {JobAlreadyExistsError}
 * @throws {InvalidJobConfigError}
 */
HubManager.prototype._loadJobs = function() {
	this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_LOAD_JOBS,
		this,
		[this.jobs],
		function(jobStore) {
			jobStore.registerJobs(require(this.options.jobsModulePath));
		}
	);
};

/**
 * Get the key to identify unique tracked jobs,
 * or null if a job does not have uniqueness.
 *
 * @param {string|JobConfig} job
 * @param {*} [params]
 * @returns {string|null}
 * @throws {JobNotFoundError}
 * @throws {InvalidUniqueKeyError}
 */
HubManager.prototype.getUniqueKey = function(job, params) {
	var jobConfig = job;
	if (typeof job === 'string') {
		jobConfig = this.jobs.getJobConfig(job);
		if (!jobConfig) {
			throw new errors.JobNotFoundError(job);
		}
	}
	return util.getUniqueKey(jobConfig, params);
};

/**
 * Check if params are valid for a job,
 * defaulting to true if the job doesn't validate params
 *
 * @param {string|JobConfig} job
 * @param {*} params
 * @returns {*|Promise}
 * @throws {JobNotFoundError}
 * @throws {InvalidJobParamError}
 */
HubManager.prototype.validateJobParams = function(job, params) {
	var jobConfig = job;
	if (typeof job === 'string') {
		jobConfig = this.jobs.getJobConfig(job);
		if (!jobConfig) {
			throw new errors.JobNotFoundError(job);
		}
	}
	return util.validateJobParams(jobConfig, params);
};

/**
 * Attempt to find the existing tracked job based on uniqueness
 *
 * @param {JobConfig} jobConfig
 * @param {*} params
 * @returns {TrackedJob|null}
 * @throws {InvalidUniqueKeyError}
 */
HubManager.prototype.findUniqueRunningJob = function(jobConfig, params) {
	var lookup = this._trackedUniqueLookup[jobConfig.jobName];
	if (!lookup) {
		return null;
	}

	var key = this.getUniqueKey(jobConfig, params);
	if (key == null) {
		return null;
	}

	return lookup[key] || null;
};

/**
 * Queue a job to be run with the specified params
 *
 * @param {string|JobConfig} job
 * @param {*} [params]
 * @returns {TrackedJob}
 * @throws {JobNotFoundError}
 */
HubManager.prototype.queueJob = function(job, params) {
	var jobConfig = job;
	if (typeof job === 'string') {
		jobConfig = this.jobs.getJobConfig(job);
		if (!jobConfig) {
			throw new errors.JobNotFoundError(job);
		}
	}

	var jobName = jobConfig.jobName;

	// Determine the unique key for the params, if applicable
	var uniqueLookupKey = this.getUniqueKey(jobConfig, params);

	// First attempt to match to an existing "unique" job
	if (uniqueLookupKey != null) {
		var existingJob = this._trackedUniqueLookup[jobName][uniqueLookupKey];
		if (existingJob) {
			return existingJob;
		}
	}

	// Create the TrackedJob instance, allowing middleware to customize the creation
	var trackedJob = this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_CREATE_JOB,
		this,
		[jobConfig, params],
		function(jobConfig, params) {
			return new TrackedJob(this, createUUID(), jobConfig, params);
		}.bind(this)
	);

	var jobId = jobConfig.jobId;

	// Add the job to the lookup
	this._trackedByJobId[jobId] = trackedJob;

	// Add the job to the unique lookup, if applicable
	if (uniqueLookupKey != null) {
		this._trackedUniqueLookup[jobName][uniqueLookupKey] = trackedJob;
	}

	// Handle cleanup once the job settles (i.e. resolves or fails)
	var onSettle = function() {
		if (this._trackedUniqueLookup[jobName][uniqueLookupKey] === trackedJob) {
			delete this._trackedUniqueLookup[jobName][uniqueLookupKey];
		}
		this.queueForTermination.apply(this, arguments);
	}.bind(this, trackedJob);
	trackedJob.on(constants.EVENT_JOB_SUCCESS, onSettle);
	trackedJob.on(constants.EVENT_JOB_FAILURE, onSettle);

	// Re-emit TrackedJob events to this manager
	trackedJob.reEmitTo(this);

	this.emit(constants.EVENT_JOB_CREATED, trackedJob);

	// Start the job
	trackedJob.run();

	return trackedJob;
};

/**
 * Queue a job for termination
 *
 * @param {TrackedJob} trackedJob
 */
HubManager.prototype.queueForTermination = function(trackedJob) {
	if (trackedJob.childProcess) {
		var termTimeout = this.options.terminationSIGTERMTimeout;
		var killTimeout = this.options.terminationSIGKILLTimeout;

		// Queue
		if (termTimeout > 0) {
			this._terminationQueue.push(trackedJob);

			var termId, killId;

			termId = setTimeout(function() {
				// TODO: Log warning
				trackedJob.childProcess.kill();

				// Queue SIGKILL if timeout is valid
				if (killTimeout > 0) {
					killId = setTimeout(function() {
						// TODO: Log warning
						trackedJob.childProcess.kill(9);
					}, killTimeout).unref();
				}
			}, termTimeout).unref();

			trackedJob.childProcess.on('exit', function() {
				clearTimeout(termId);
				clearTimeout(killId);
			});
		}
	}
};
