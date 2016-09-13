var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var fork = require('child_process').fork;
var constants = require('./constants');
var util = require('./util');
var JobForkObserver = require('./JobForkObserver');

module.exports = TrackedJob;

/**
 * Tracks a job that has not yet completed
 *
 * @param {HubManager} manager
 * @param {string} jobId - ID for the tracked job
 * @param {JobConfig} jobConfig
 * @param {*} [params]
 * @property {Date} date - When the TrackedJob was created
 * @property {string|null} stage - null until run is called, after which it is the name of the stage of running a job that is executing, or for a job that resolved/rejected it is the stage that was run just before resolving or rejecting.
 * @property {HubManager} manager
 * @property {string} jobId - ID for the tracked job
 * @property {JobConfig} jobConfig
 * @property {*} params - Parameters passed to the job handler
 * @property {boolean} isRunning - true once run() is called and false after the job succeeds or fails.
 * @property {null|Promise} promise - Set to a Promise after run() is called, and is fulfilled once the job succeeds or fails.
 * @property {null|ChildProcess} childProcess - Set to the ChildProcess instance returned by require('child_process').fork after run() is called
 * @property {null|*} progress - The progress of the job as initiall set by {@see JobConfig#getInitialProgress} or as specified by the job config or emitted
 * @class
 */
function TrackedJob(manager, jobId, jobConfig, params) {
	EventEmitter.call(this);

	this.created = new Date();
	this.stage = null;
	this.manager = manager;
	this.jobId = jobId;
	this.jobConfig = jobConfig;
	this.params = params;
	this.isRunning = false;
	this.promise = null;
	this.childProcess = null;
	this.progress = null;
}

// JobForkObserver extends EventEmitter
inherits(TrackedJob, EventEmitter);

/**
 * Convinence method for TrackedJob.promise.then
 *
 * Only usable after TrackedJob#run is called
 *
 * @returns {Promise}
 */
TrackedJob.prototype.then = function() {
	var promise = this.promise
		? this.promise
		: Promise.reject(new Error('Cannot use TackedJob#then as Promise until TrackedJob#run is called'));
	return promise.then.apply(promise, arguments);
};

/**
 * Convinence method for TrackedJob.promise.catch
 *
 * Only usable after TrackedJob#run is called
 *
 * @returns {Promise}
 */
TrackedJob.prototype.catch = function() {
	var promise = this.promise
		? this.promise
		: Promise.reject(new Error('Cannot use TackedJob#catch as Promise until TrackedJob#run is called'));
	return promise.catch.apply(promise, arguments);
};

/**
 * Start the job, if it has not already started
 *
 * @returns {TrackedJob} this
 */
TrackedJob.prototype.run = function() {
	if (!this.promise) {
		// Mark as running
		this.isRunning = true;

		// Mark as validating params
		this.stage = constants.JOB_STAGE_VALIDATE_PARAMS;

		// Start Promise so all errors are caught by it
		this.promise = Promise.resolve()

			// Validate job params
			.then(function() {
				return this.manager.validateJobParams(this.jobConfig, this.params);
			}.bind(this))

			// Run the job
			.then(function() {
				return new Promise(function(resolve, reject) {
					// Mark as validating params
					this.stage = constants.JOB_STAGE_QUICK_RUN;

					// First we will attempt to "quick run" the job
					var attemptQuickRun = this._attemptQuickRun.bind(this);

					// Otherwise we will run the job in a separate process
					var next = function() {
						this.stage = constants.JOB_STAGE_RUN;
						resolve(this._startWorker());
					}.bind(this);

					// Call safely so only the first callback will be used
					// and also pass thrown errors to reject
					util.onlyOneCallback(
						util.rejectOnThrow(reject, attemptQuickRun),
						resolve,
						reject,
						util.rejectOnThrow(reject, next)
					);
				}.bind(this));
			}.bind(this))

			// Handle completion, whether success or failure
			.then(function(result) {
				this.isRunning = false;
				if (this.jobConfig.onSuccess) {
					this.jobConfig.onSuccess(result, this);
				}
				this.emit(constants.EVENT_JOB_SUCCESS, result);
				return result;
			}.bind(this), function(err) {
				this.isRunning = false;
				if (this.jobConfig.onFailure) {
					this.jobConfig.onFailure(err, this);
				}
				this.emit(constants.EVENT_JOB_FAILURE, err);
				throw err;
			}.bind(this));

		this.emit(constants.EVENT_JOB_STARTED);
	}

	return this;
};

/**
 * Attempts to "quick run" a job, which happens in the manager's process
 *
 * @private
 * @param {function} resolve
 * @param {function} reject
 * @param {function} next
 */
TrackedJob.prototype._attemptQuickRun = function(resolve, reject, next) {
	if (this.jobConfig.quickRun) {
		// Run params through stringification to normalize
		var cleanedParams = typeof this.params === 'undefined'
			? this.params
			: JSON.parse(JSON.stringify(this.params));

		var sendProgress = function(progress) {
			// Run progress through stringification to normalize
			progress = typeof progress === 'undefined'
				? progress
				: JSON.parse(JSON.stringify(progress));

			this.progress = progress;

			if (this.jobConfig.onProgress) {
				this.jobConfig.onProgress(progress, this);
			}

			this.emit(constants.EVENT_JOB_PROGRESS, progress);
		}.bind(this);

		// TODO: Clean resolve value through JSON.stringify
		var job = {
			jobId: this.jobId,
			params: cleanedParams,
			resolve: resolve,
			reject: reject,
			sendProgress: sendProgress
		};

		this.jobConfig.quickRun(job, next);
	}
	else {
		next();
	}
};

/**
 * Start the job in a separate process
 *
 * @private
 * @returns {Promise}
 */
TrackedJob.prototype._startWorker = function() {
	this.childProcess = this._forkWorkerProcess();
	this.emit(constants.EVENT_JOB_FORKED);
	return this._observeStartedWorker();
};

/**
 * Fork a child process to run the job, using "forkModulePath" as the module name
 *
 * @private
 * @returns {ChildProcess}
 */
TrackedJob.prototype._forkWorkerProcess = function() {
	var args = this._buildForkArgs();
	var opts = this._buildForkOpts();
	return this.manager.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_FORK_JOB_PROCESS,
		this,
		[this.manager.options.forkModulePath, args, opts],
		fork
	);
};

/**
 * Build the args for the fork call
 *
 * @private
 * @returns {string[]}
 */
TrackedJob.prototype._buildForkArgs = function() {
	return this.manager.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_BUILD_FORK_ARGS,
		this,
		[this],
		function(trackedJob) {
			return [
				'--useIPC',
				'--jobName=' + trackedJob.jobConfig.jobName,
				'--jobId=' + trackedJob.jobId
			];
		}
	);
};

/**
 * Build the args for the fork call
 *
 * @private
 * @returns {object}
 */
TrackedJob.prototype._buildForkOpts = function() {
	return this.manager.middleware.runSyncMiddleware(
		constants.MIDDLEWARE_BUILD_FORK_OPTS,
		this,
		[this],
		function() {
			return {};
		}
	);
};

/**
 * Start observing the started worker to emit resolve, reject and progress events
 *
 * @private
 * @returns {Promise}
 */
TrackedJob.prototype._observeStartedWorker = function() {
	var sendProgress = function(progress) {
		this.progress = progress;

		if (this.jobConfig.onProgress) {
			this.jobConfig.onProgress(progress, this);
		}

		this.emit(constants.EVENT_JOB_PROGRESS, progress);
	}.bind(this);

	return new Promise(function(resolve, reject) {
		this.manager.middleware.runSyncMiddleware(
			constants.MIDDLEWARE_OBSERVE_WORKER_PROCESS,
			this,
			[sendProgress, resolve, reject],
			function(sendProgress, resolve, reject) {
				// Note: Only returning instance for automated tests
				return new JobForkObserver(this, sendProgress, resolve, reject);
			}
		);
	}.bind(this));
};

/**
 * Re-emit TrackedJob events to another EventEmitter,
 * preceeding arguments with an argument for this TrackedJob instance
 *
 * @param {EventEmitter} eventEmitter
 * @returns {TrackedJob} this
 */
TrackedJob.prototype.reEmitTo = function(eventEmitter) {
	this.on(constants.EVENT_JOB_STARTED, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_STARTED, this));
	this.on(constants.EVENT_JOB_FORKED, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_FORKED, this));
	this.on(constants.EVENT_JOB_PROGRESS, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_PROGRESS, this));
	this.on(constants.EVENT_JOB_SUCCESS, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_SUCCESS, this));
	this.on(constants.EVENT_JOB_FAILURE, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_FAILURE, this));
	return this;
};
