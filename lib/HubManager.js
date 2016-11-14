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
 * Configuration options for the {@link HubManager}.
 * @typedef {object} HubManagerOptions
 */

/**
 * Path to node module that defines job config.
 * @member {string} HubManagerOptions#jobsModulePath
 */

/**
 * Path to node module that initializes workers.
 * @member {null|string} HubManagerOptions#initModulePath
 * @default null
 */

/**
 * Path to node script used to fork the child processes.
 * @member {string} HubManagerOptions#forkModulePath
 * @default jobhub/lib/worker.js
 */

/**
 * @member {number} HubManagerOptions#terminationSIGTERMTimeout
 * @default 60000
 */

/**
 * @member {number} HubManagerOptions#terminationSIGKILLTimeout
 * @default 60000
 */

/**
 * Number of milliseconds that a child process must confirm it has started up before its considered failed.
 * @member {number} HubManagerOptions#workerStartupTimeout
 * @default 20000
 */

/**
 * Function that generates the {@link TrackedJob#jobId}.
 * @member {function} HubManagerOptions#createId
 * @default require('uuid').v4
 */

/**
 * @classdesc Manages the lifecyle of jobs.
 *
 * @class
 * @param {HubManagerOptions} options
 * @fires HubManager#managerStarted
 * @fires HubManager#jobCreated
 * @fires HubManager#jobStarted
 * @fires HubManager#jobForked
 * @fires HubManager#jobProgress
 * @fires HubManager#jobSuccess
 * @fires HubManager#jobFailure
 * @fires HubManager#jobTerminate
 */
function HubManager(options) {
	EventEmitter.call(this);

	/**
	 * Parsed options provided to HubManager.
	 * @member {HubManagerOptions} HubManager#options
	 */
	this.options = util.parseManagerOptions(options, util.getDefaultManagerOptions());

	/**
	 * Lookup for checking uniqueness (jobName -> uniqueKey -> jobId)
	 * @member {object.<string,object.<string,string>>} HubManager#_trackedUniqueLookup
	 * @private
	 */
	this._trackedUniqueLookup = Object.create(null);

	/**
	 * Lookup for checking uniqueness (jobName -> jobId -> uniqueJob)
	 * @member {object.<string,object.<string,string>>} HubManager#_trackedUniqueReverseLookup
	 * @private
	 */
	this._trackedUniqueReverseLookup = Object.create(null);

	/**
	 * Lookup for jobs by their ID
	 * @member {object.<string,TrackedJob>} HubManager#_trackedByJobId
	 * @private
	 */
	this._trackedByJobId = Object.create(null);

	/**
	 * Lookup of jobs that have completed and will be forced to terminate after a timeout
	 * @member {TrackedJob[]} HubManager#_terminationMap
	 * @private
	 */
	this._terminationMap = Object.create(null);

	/**
	 * Middleware store used by the HubManager.
	 * @member {MiddlewareStore} HubManager#middleware
	 */
	this.middleware = new MiddlewareStore();

	/**
	 * Stores {@link JobConfig} registered for the HubManager.
	 * @member {JobConfigStore} HubManager#jobs
	 */
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
 * Start the HubManager instance, loading jobs from the module specified by {@link HubManagerOptions#jobsModulePath}.
 *
 * @returns {HubManager}
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

	this._emitManagerStarted();

	return this;
};

/**
 * Add a sync middleware.
 *
 * Shortcut for `hubManager.middleware.addSyncMiddlware` that allows chaining.
 *
 * @param {string} type
 * @param {function} middleware
 * @param {number} [priority=100]
 * @returns {HubManager}
 * @throws {UnsupportedMiddlewareTypeError}
 */
HubManager.prototype.addSyncMiddlware = function(type, middleware, priority) {
	this.middleware.addSyncMiddlware(type, middleware, priority);
	return this;
};

/**
 * Get the list of supported sync middleware types.
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
 * Check if params are valid for a job, if validation if specified in its {@link JobConfig}.
 *
 * @param {string|JobConfig} job
 * @param {*} params
 * @returns {Promise}
 * @fulfil {void} - If JobConfig does not validate or params are valid.
 * @reject {JobNotFoundError} - Indicates the job argument is a string and the job wasn't found.
 * @reject {InvalidJobParamError} - Indicates the job's params are invalid.
 */
HubManager.prototype.validateJobParams = function(job, params) {
	var jobConfig = job;
	if (typeof job === 'string') {
		jobConfig = this.jobs.getJobConfig(job);
		if (!jobConfig) {
			return Promise.reject(new errors.JobNotFoundError(job));
		}
	}

	// TODO: Add async middleware for validation
	return util.validateJobParams(jobConfig, params);
};

/**
 * Get a running TrackedJob by jobId.
 *
 * @param {string} jobId
 * @returns {TrackedJob|null}
 */
HubManager.prototype.getTrackedJob = function(jobId) {
	return this._trackedByJobId[jobId] || null;
};

/**
 * Get running TrackedJobs.
 *
 * @returns {TrackedJob[]}
 */
HubManager.prototype.getTrackedJobs = function() {
	return util.objectValues(this._trackedByJobId);
};

/**
 * Attempt to find the existing tracked job based on uniqueness.
 *
 * @param {string} jobName
 * @param {string} [uniqueKey] - Must be specified for jobs that implement {@link JobConfig#uniqueKey}.
 * @returns {TrackedJob|null}
 * @throws {InvalidUniqueKeyError}
 */
HubManager.prototype.findUniqueTrackedJob = function(jobName, uniqueKey) {
	if (uniqueKey == null) {
		uniqueKey = constants.UNIQUE_KEY;
	}

	var lookup = this._trackedUniqueLookup[jobName];
	if (!lookup) {
		return null;
	}

	return lookup[uniqueKey] && this._trackedByJobId[lookup[uniqueKey]] || null;
};

/**
 * Queue a job to be run with the specified params.
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

	this._emitJobCreated(trackedJob);

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
 * Queue a job for termination.
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
				this._emitJobTerminate(trackedJob, false);

				// Queue SIGKILL if timeout is valid
				if (killTimeout > 0) {
					killId = setTimeout(function() {
						trackedJob.workerMediator.terminate(true);
						this._emitJobTerminate(trackedJob, true);
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

/**
 * Fired when {@link HubManager#start} is called, after job definitions have been loaded.
 *
 * @event HubManager#managerStarted
 */
HubManager.prototype._emitManagerStarted = function() {
	this.emit(constants.EVENT_MANAGER_STARTED);
};

/**
 * Fired when a job is queued *and* created. This is not fired if an existing unique job was found.
 *
 * @event HubManager#jobCreated
 * @param {TrackedJob} trackedJob
 */
HubManager.prototype._emitJobCreated = function(trackedJob) {
	this.emit(constants.EVENT_JOB_CREATED, trackedJob);
};

/**
 * Fired when a job that has not gracefully excited is being terminated.
 *
 * @event HubManager#jobTerminate
 * @param {TrackedJob} trackedJob
 * @param {boolean} isForceKill - If the job is being forced to exit (i.e. kill -9)
 */
HubManager.prototype._emitJobTerminate = function(trackedJob, isForceKill) {
	this.emit(constants.EVENT_JOB_TERMINATE, trackedJob, isForceKill);
};

/**
 * Fires when a job is started using {@link TrackedJob#run}.
 *
 * @event HubManager#jobStarted
 * @param {TrackedJob} trackedJob
 */

/**
 * Fires when a job forks its child worker process.
 *
 * @event HubManager#jobForked
 * @param {TrackedJob} trackedJob
 */

/**
 * Fires when a job sends its 'progress'.
 *
 * @event HubManager#jobProgress
 * @param {TrackedJob} trackedJob
 * @param {*} progress
 */

/**
 * Fires when a job reports success.
 *
 * @event HubManager#jobSuccess
 * @param {TrackedJob} trackedJob
 * @param {*} result
 */

/**
 * Fires when a job reports failure.
 *
 * @event HubManager#jobFailure
 * @param {TrackedJob} trackedJob
 * @param {Error} error
 */

/**
 * Intercepts loading and registering of jobs from
 * {@link HubManagerOptions#jobsModulePath} by {@link HubManager#start}.
 *
 * @protected
 * @function loadJobs
 * @param {JobConfigStore} jobs
 * @param {function} next
 * @this HubManager
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('loadJobs', function(jobs, next) {
 *     // Load a special job
 *     jobs.registerJob('check-power-level', {
 *         run: function(job) {
 *             job.resolve('> 9000');
 *         }
 *     });
 *
 *     // Keep loading jobs
 *     next();
 * });
 * ```
 */

/**
 * Intercepts creating a {@link TrackedJob} instance.
 *
 * @protected
 * @function createJob
 * @param {string} jobId
 * @param {JobConfig} jobConfig
 * @param {*} params
 * @param {function} next
 * @this HubManager
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('createJob', function(jobId, jobConfig, params, next) {
 *     // Get the result of the middleware
 *     var trackedJob = next();
 *
 *     // Set a custom property to the trackedJob
 *     trackedJob.mySpecialProp = 500;
 *
 *     return trackedJob;
 * });
 * ```
 */
