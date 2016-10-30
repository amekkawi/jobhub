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
 * @typedef {object} HubManager~Options
 * @property {string} jobsModulePath
 * @property {string} [initModulePath]
 * @property {string} [forkModulePath]
 * @property {number} [terminationSIGTERMTimeout=60000]
 * @property {number} [terminationSIGKILLTimeout=60000]
 * @property {number} [workerStartupTimeout=20000]
 * @property {function} [createId=require('uuid').v4]
 */

/**
 * Manages lifecyle of jobs
 *
 * @param {HubManager~Options} [options]
 * @property {HubManager~Options} options
 * @property {JobConfigStore} jobs
 * @property {MiddlewareStore} middleware
 * @class
 */
function HubManager(options) {
	EventEmitter.call(this);

	// Create cleaned version of options
	this.options = util.parseManagerOptions(options, util.getDefaultManagerOptions());

	/**
	 * Lookup for checking uniqueness (jobName -> uniqueKey -> jobId)
	 * @type {object.<string,object.<string,string>>}
	 * @private
	 */
	this._trackedUniqueLookup = Object.create(null);

	/**
	 * Lookup for checking uniqueness (jobName -> jobId -> uniqueJob)
	 * @type {object.<string,object.<string,string>>}
	 * @private
	 */
	this._trackedUniqueReverseLookup = Object.create(null);

	/**
	 * Lookup for jobs by their ID
	 * @type {object.<string,TrackedJob>}
	 * @private
	 */
	this._trackedByJobId = Object.create(null);

	/**
	 * Lookup of jobs that have completed and will be forced to terminate after a timeout
	 * @type {TrackedJob[]}
	 * @private
	 */
	this._terminationMap = Object.create(null);

	this.middleware = new MiddlewareStore();
	this.jobs = new JobConfigStore();

	// Handle cleanup once a job settles (i.e. resolves or fails)
	var handleSettled = this.handleSettledJob.bind(this);
	this.on(constants.EVENT_JOB_SUCCESS, handleSettled);
	this.on(constants.EVENT_JOB_FAILURE, handleSettled);

	// Add built-in supported middleware types
	this.middleware.addSupportedSyncTypes(this.getSupportedSyncMiddleware());
}

// HubManager extends EventEmitter
inherits(HubManager, EventEmitter);

/**
 * Start the HubManager instance, loading jobs from the module specified by 'jobsModulePath'
 *
 * @returns {HubManager} this
 * @throws {JobAlreadyExistsError}
 * @throws {InvalidJobConfigError}
 */
HubManager.prototype.start = function() {
	this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_LOAD_JOBS,
		this,
		[this.jobs],
		function(jobStore) {
			jobStore.registerJobs(require(this.options.jobsModulePath));
		}
	);

	this.emit(constants.EVENT_MANAGER_STARTED);

	return this;
};

/**
 * Add a sync middleware
 *
 * Shortcut for `hubManager.middleware.addSyncMiddlware` that allows chaining.
 *
 * @param {string} type
 * @param {function} middleware
 * @param {number} [priority=100]
 * @returns {HubManager} this
 * @throws {UnsupportedMiddlewareTypeError}
 */
HubManager.prototype.addSyncMiddlware = function(type, middleware, priority) {
	this.middleware.addSyncMiddlware(type, middleware, priority);
	return this;
};

/**
 * Get the list of supported sync middleware types
 *
 * @protected
 * @returns {string[]}
 */
HubManager.prototype.getSupportedSyncMiddleware = function() {
	return [
		constants.MIDDLEWARE_LOAD_JOBS,
		constants.MIDDLEWARE_CREATE_JOB,
		constants.MIDDLEWARE_FORK_JOB_PROCESS,
		constants.MIDDLEWARE_BUILD_FORK_ARGS,
		constants.MIDDLEWARE_BUILD_FORK_OPTS,
		constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR
	];
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
 * Check if params are valid for a job, if validation if specified in its {@link JobConfig}
 *
 * <p>Returns a promise which:</p>
 *
 * <ul>
 * <li>Resolves to undefined if JobConfig does not validate or params are valid.</li>
 * <li>Rejects with {@link JobNotFoundError} if job param is a string and the job wasn't found.</li>
 * <li><em>Should</em> reject with {@link module:errors:InvalidJobParamError} if job params are invalid.</li>
 * </ul>
 *
 * @param {string|JobConfig} job
 * @param {*} params
 * @returns {Promise}
 */
HubManager.prototype.validateJobParams = function(job, params) {
	var jobConfig = job;
	if (typeof job === 'string') {
		jobConfig = this.jobs.getJobConfig(job);
		if (!jobConfig) {
			return Promise.reject(new errors.JobNotFoundError(job));
		}
	}

	return util.validateJobParams(jobConfig, params);
};

/**
 * Attempt to find the existing tracked job based on uniqueness
 *
 * @param {string} jobName
 * @param {string} uniqueKey
 * @returns {TrackedJob|null}
 * @throws {InvalidUniqueKeyError}
 */
HubManager.prototype.findUniqueTrackedJob = function(jobName, uniqueKey) {
	var lookup = this._trackedUniqueLookup[jobName];

	if (!lookup || uniqueKey == null) {
		return null;
	}

	return lookup[uniqueKey] && this._trackedByJobId[lookup[uniqueKey]] || null;
};

/**
 * Queue a job to be run with the specified params
 *
 * @param {string|JobConfig} job
 * @param {*} [params]
 * @returns {TrackedJob}
 * @throws {JobNotFoundError}
 * @throws {InvalidUniqueKeyError}
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
		var existingJob = this.findUniqueTrackedJob(jobName, uniqueLookupKey);
		if (existingJob) {
			return existingJob;
		}
	}

	// Create the TrackedJob instance, allowing middleware to customize the creation
	var trackedJob = this.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_CREATE_JOB,
		this,
		[this.options.createId(), jobConfig, params],
		function(jobId, jobConfig, params) {
			return new TrackedJob(this, jobId, jobConfig, params);
		}.bind(this)
	);

	// Add the job to the lookups
	this._addJobToLookups(trackedJob, uniqueLookupKey);

	// Re-emit TrackedJob events to this manager
	trackedJob.reEmitTo(this);

	if (jobConfig.onCreate) {
		jobConfig.onCreate(trackedJob);
	}

	this.emit(constants.EVENT_JOB_CREATED, trackedJob);

	// Start the job
	trackedJob.run();

	return trackedJob;
};

/**
 * Add TrackedJob to the internal lookups.
 *
 * @param {TrackedJob} trackedJob
 * @param {string} uniqueKey
 * @private
 */
HubManager.prototype._addJobToLookups = function(trackedJob, uniqueKey) {
	var jobId = trackedJob.jobId;
	var jobName = trackedJob.jobConfig.jobName;

	// Add to the ID lookup
	this._trackedByJobId[jobId] = trackedJob;

	// Add to the unique lookup, if applicable
	if (uniqueKey != null) {
		var lookup = this._trackedUniqueLookup[jobName]
			|| (this._trackedUniqueLookup[jobName] = Object.create(null));

		var reverseLookup = this._trackedUniqueReverseLookup[jobName]
			|| (this._trackedUniqueReverseLookup[jobName] = Object.create(null));

		lookup[uniqueKey] = jobId;
		reverseLookup[jobId] = uniqueKey;
	}
};

/**
 * Handle a TrackedJob that has settled (either success or failure).
 *
 * Removes TrackedJob from internal lookups and calls {@link HubManager#queueForTermination}.
 *
 * @protected
 * @param {TrackedJob} trackedJob
 */
HubManager.prototype.handleSettledJob = function(trackedJob) {
	var jobId = trackedJob.jobId;
	var jobName = trackedJob.jobConfig.jobName;

	// Delete the job from the ID lookup
	delete this._trackedByJobId[jobId];

	// Delete the job from the unique lookups, if applicable
	var uniqueKey = this._trackedUniqueReverseLookup[jobName] && this._trackedUniqueReverseLookup[jobName][jobId] || null;
	if (uniqueKey != null) {
		delete this._trackedUniqueLookup[jobName][jobId];
		delete this._trackedUniqueReverseLookup[jobName][uniqueKey];
	}

	// Queue the job for termination
	this.queueForTermination(trackedJob);
};

/**
 * Queue a job for termination
 *
 * @protected
 * @param {TrackedJob} trackedJob
 */
HubManager.prototype.queueForTermination = function(trackedJob) {
	if (trackedJob.workerMediator && trackedJob.workerMediator.started && !trackedJob.workerMediator.exited) {
		var termTimeout = this.options.terminationSIGTERMTimeout;
		var killTimeout = this.options.terminationSIGKILLTimeout;

		// Queue
		if (termTimeout > 0) {
			this._terminationMap[trackedJob.jobId] = trackedJob;

			var termId, killId;

			termId = setTimeout(function() {
				trackedJob.workerMediator.terminate();
				this.emit(constants.EVENT_JOB_TERMINATE, trackedJob, false);

				// Queue SIGKILL if timeout is valid
				if (killTimeout > 0) {
					killId = setTimeout(function() {
						trackedJob.workerMediator.terminate(true);
						this.emit(constants.EVENT_JOB_TERMINATE, trackedJob, true);
					}.bind(this), killTimeout).unref();
				}
			}.bind(this), termTimeout).unref();

			trackedJob.workerMediator.on(constants.EVENT_JOB_EXIT, function() {
				clearTimeout(termId);
				clearTimeout(killId);
				delete this._terminationMap[trackedJob.jobId];
			}.bind(this));
		}
	}
};
