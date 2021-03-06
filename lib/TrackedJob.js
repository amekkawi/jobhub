var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var constants = require('./constants');
var errors = require('./errors');
var util = require('./util');
var JobWorkerIPCMediator = require('./JobWorkerIPCMediator');

module.exports = TrackedJob;

/**
 * @classdesc Tracks a job that has not yet completed.
 *
 * @class
 * @augments {EventEmitter}
 * @param {HubManager} manager
 * @param {string} jobId - Unique ID for the tracked job.
 * @param {JobConfig} jobConfig
 * @param {*} [params]
 * @fires TrackedJob#jobStarted
 * @fires TrackedJob#jobForked
 * @fires TrackedJob#jobProgress
 * @fires TrackedJob#jobSuccess
 * @fires TrackedJob#jobFailure
 * @fires TrackedJob#jobAbort
 */
function TrackedJob(manager, jobId, jobConfig, params) {
	EventEmitter.call(this);

	/**
	 * Date when the TrackedJob was created.
	 *
	 * @member {Date} TrackedJob#created
	 */
	this.created = new Date();

	/**
	 * The name of the stage of the tracked job's lifecycle that is executing, or for a job
	 * that resolved/rejected it is the stage that was run just before resolving or rejecting.
	 *
	 * Stage values:
	 *
	 * * `null` - Initial value until {@link TrackedJob#run} is called.
	 * * `"validateParams"` - Set just before validating the params.
	 * * `"quickRun"` - Set just before attempting to quick run the job (even if {@link JobConfig#quickRun} is not defined).
	 * * `"run"` - Set just before starting the child worker.
	 *
	 * @member {string|null} TrackedJob#stage
	 */
	this.stage = null;

	/**
	 * The {@link HubManager} that is tracking this job.
	 *
	 * @member {HubManager} TrackedJob#manager
	 */
	this.manager = manager;

	/**
	 * Unique ID for the tracked job.
	 *
	 * @member {string} TrackedJob#jobId
	 */
	this.jobId = jobId;

	/**
	 * The {@link JobConfig} used to create this job.
	 *
	 * @member {JobConfig} TrackedJob#jobConfig
	 */
	this.jobConfig = jobConfig;

	/**
	 * Parameters for this job passed from {@link HubManager#queueJob}.
	 *
	 * @member {*} TrackedJob#params
	 */
	this.params = params;

	/**
	 * Set to `true` once {@link JobConfig#run} is called and false after the job succeeds or fails.
	 *
	 * @member {boolean} TrackedJob#isRunning
	 */
	this.isRunning = false;

	/**
	 * Set to `true` once the job succeeds or fails.
	 *
	 * @member {boolean} TrackedJob#isSettled
	 */
	this.isSettled = false;

	/**
	 * Indicates that {@link TrackedJob#abort} has been called, but does not mean the job has actually aborted.
	 *
	 * See {@link TrackedJob#abort} for detail.
	 *
	 * @member {boolean} TrackedJob#aborted
	 */
	this.aborted = false;

	/**
	 * User-specified message for the reason the job was aborted, set by {@link TrackedJob#abort}.
	 *
	 * @member {null|string} TrackedJob#abortReason
	 */
	this.abortReason = null;

	/**
	 * Error instance that will be used to reject the job.
	 *
	 * @private
	 * @type {null|JobAbortedError}
	 * @see {@link TrackedJob#abort}
	 */
	this._abortError = null;

	/**
	 * Set to a Promise after run() is called, and is fulfilled once the job succeeds or fails.
	 *
	 * @member {null|Promise} TrackedJob#promise
	 */
	this.promise = null;

	/**
	 * Set to the worker mediator instance if a worker is started.
	 *
	 * @member {null|JobWorkerMediator} TrackedJob#workerMediator
	 */
	this.workerMediator = null;

	/**
	 * Set to the result returned by the job, if the job completes successfully.
	 *
	 * @member {*} TrackedJob#result
	 * @see {@link JobRunArg#resolve}
	 */
	this.result = null;

	/**
	 * Set to an error, if the job completes in failure.
	 *
	 * @member {null|Error} TrackedJob#error
	 */
	this.error = null;

	/**
	 * The last emitted progress value.
	 *
	 * @member {*} TrackedJob#progress
	 */
	this.progress = null;
}

// TrackedJob extends EventEmitter
inherits(TrackedJob, EventEmitter);

/**
 * Promise-like `then` method.
 *
 * @returns {Promise}
 */
TrackedJob.prototype.then = function() {
	var promise = this.promise;

	if (!promise) {
		promise = new Promise(function(resolve) {
			var onPromiseAvailable = function() {
				this.removeListener(constants.EVENT_JOB_STARTED, onPromiseAvailable);
				this.removeListener(constants.EVENT_JOB_FAILURE, onPromiseAvailable);
				resolve(this.promise);
			}.bind(this);

			this.on(constants.EVENT_JOB_STARTED, onPromiseAvailable);
			this.on(constants.EVENT_JOB_FAILURE, onPromiseAvailable);
		}.bind(this));
	}

	return promise.then.apply(promise, arguments);
};

/**
 * Promise-like `catch` method.
 *
 * @returns {Promise}
 */
TrackedJob.prototype.catch = function() {
	var promise = this.promise;

	if (!promise) {
		promise = new Promise(function(resolve) {
			var onPromiseAvailable = function() {
				this.removeListener(constants.EVENT_JOB_STARTED, onPromiseAvailable);
				this.removeListener(constants.EVENT_JOB_FAILURE, onPromiseAvailable);
				resolve(this.promise);
			}.bind(this);

			this.on(constants.EVENT_JOB_STARTED, onPromiseAvailable);
			this.on(constants.EVENT_JOB_FAILURE, onPromiseAvailable);
		}.bind(this));
	}

	return promise.catch.apply(promise, arguments);
};

/**
 * Start the job, if it has not already started.
 *
 * @returns {TrackedJob}
 */
TrackedJob.prototype.run = function() {
	if (!this.promise) {
		this.promise = util.promiseTry(function() {
			// Mark as running
			this.isRunning = true;

			// Mark as validating params
			this.stage = constants.JOB_STAGE_VALIDATE_PARAMS;
		}.bind(this))
			.then(function() {
				this._emitJobStarted();

				// Validate job params
				return new Promise(function(resolve, reject) {
					this._setAbortWatcher(reject);

					util.validateJobParams(this.jobConfig, this.params)
						.then(resolve, reject);
				}.bind(this));
			}.bind(this))
			.then(function() {
				// Run the job
				return new Promise(function(resolve, reject) {
					// Mark as validating params
					this.stage = constants.JOB_STAGE_QUICK_RUN;

					// First we will attempt to "quick run" the job
					var attemptQuickRun = this._attemptQuickRun.bind(this);

					// Otherwise we will run the job in a separate process
					var next = function() {
						resolve(
							// Make sure the next stage starts asynchronously
							Promise.resolve().then(function() {
								this.stage = constants.JOB_STAGE_RUN;
								return this._startWorker();
							}.bind(this))
						);
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
				this.isSettled = true;
				this.result = result;
				this._abortError = null;
				this.removeAllListeners('___INTERNAL_JOB_ABORT___');
				this._emitJobSuccess(result);
				return result;
			}.bind(this), function(err) {
				this.isRunning = false;
				this.isSettled = true;
				this.error = err;
				this._abortError = null;
				this.removeAllListeners('___INTERNAL_JOB_ABORT___');
				this._emitJobFailure(err);
				throw err;
			}.bind(this));
	}

	return this;
};

/**
 * Attempt to abort a job. Calling this method does not mean the job will actually be aborted.
 *
 * The abort will not actually happen if:
 *
 * * {@link JobConfig#validate} already threw an error for invalid params.
 * * {@link JobConfig#quickRun} already called {@link JobRunArg#resolve}/{@link JobRunArg#reject} or it threw an error.
 * * {@link TrackedJob#workerMediator} already received a success or error message from the job's worker process.
 *
 * To determine if a job was actually aborted either:
 *
 * * If {@link TrackedJob#isSettled} is `false`,
 * add a catch to {@link TrackedJob#promise} or listen for the {@link TrackedJob#event:jobFailure} event, and
 * check if the error is an instance of {@link JobAbortedError}.
 *
 *     – or –
 *
 * * If {@link TrackedJob#isSettled} is `true`,
 * check if {@link TrackedJob#error} is an instance of {@link JobAbortedError}.
 *
 * Calling this method does nothing if either {@link TrackedJob#isSettled}
 * or {@link TrackedJob#aborted} are already `true`.
 *
 * @param {string} [reason=No reason specified] - Message for why the job was aborted.
 * @returns {TrackedJob}
 * @see {@link TrackedJob#aborted}
 * @see {@link TrackedJob#abortReason}
 * @see {@link TrackedJob#sendAbortMessage}
 */
TrackedJob.prototype.abort = function(reason) {
	if (!this.isSettled && !this.aborted) {
		this.aborted = true;
		this.abortReason = reason || 'No reason specified';
		this._abortError = new errors.JobAbortedError(this.jobConfig.jobName, this.jobId, this.abortReason);

		if (this.isRunning) {
			this.emit('___INTERNAL_JOB_ABORT___');
			this._emitAbort(this.abortReason);
		}
		else {
			this._emitAbort(this.abortReason);
			this.isSettled = true;
			this.error = this._abortError;
			this._abortError = null;
			this.removeAllListeners('___INTERNAL_JOB_ABORT___');

			// Wrap jobFailure event to catch errors similar to TrackedJob#run
			this.promise = new Promise(function(resolve, reject) {
				this._emitJobFailure(this.error);
				reject(this.error);
			}.bind(this));
		}
	}

	return this;
};

/**
 * @private
 * @param {function} [cb]
 */
TrackedJob.prototype._setAbortWatcher = function(cb) {
	// Check if already aborted.
	if (this.aborted) {
		throw this._abortError;
	}

	// Remove existing callback.
	this.removeAllListeners('___INTERNAL_JOB_ABORT___');

	// Add the new callback.
	if (cb) {
		this.once('___INTERNAL_JOB_ABORT___', function() {
			// Use setImmediate to give some time for resolved/rejected promises.
			setImmediate(function() {
				// Check if error still exists, just in case the job was resolved/rejected before the callback executed.
				if (this._abortError) {
					cb(this._abortError);
				}
			}.bind(this));
		}.bind(this));
	}
};

/**
 * Attempts to "quick run" a job, which happens in the manager's process.
 *
 * @private
 * @param {function} resolve
 * @param {function} reject
 * @param {function} next
 */
TrackedJob.prototype._attemptQuickRun = function(resolve, reject, next) {
	if (this.jobConfig.quickRun) {
		this._setAbortWatcher(reject);

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

			return util.promiseTry(function() {
				this._emitJobProgress(progress);
			}.bind(this));
		}.bind(this);

		var onAbort = this.once.bind(this, constants.EVENT_JOB_ABORT);

		// TODO: Clean resolve value through JSON.stringify
		var job = {
			jobId: this.jobId,
			params: cleanedParams,
			resolve: resolve,
			reject: reject,
			sendProgress: sendProgress,
			onAbort: onAbort
		};

		this.jobConfig.quickRun(job, next);
	}
	else {
		next();
	}
};

/**
 * Start the job in a separate process.
 *
 * @private
 * @returns {Promise}
 */
TrackedJob.prototype._startWorker = function() {
	// Callback for progress updates sent by the worker
	var sendProgress = function(progress) {
		this.progress = progress;
		// TODO: Catch error from callbacks and call reject?
		this._emitJobProgress(progress);
	}.bind(this);

	return new Promise(function(resolve, reject) {
		this._setAbortWatcher(reject);

		// Create the mediator which manages communication to the worker process
		this.workerMediator = this.manager.middleware.runSyncMiddleware(
			constants.MIDDLEWARE_CREATE_WORKER_MEDIATOR,
			this,
			[this],
			function(trackedJob) {
				return new JobWorkerIPCMediator(trackedJob);
			}
		);

		this.workerMediator
			.on(constants.EVENT_JOB_SUCCESS, resolve)
			.on(constants.EVENT_JOB_FAILURE, reject)
			.on(constants.EVENT_JOB_PROGRESS, sendProgress);

		// Set abort watcher again so an abort message is sent to the child worker.
		this._setAbortWatcher(function(err) {
			// Only abort if mediator has not yet received success/failure events, since
			// it's possible that event callbacks could call abort.
			if (!this.workerMediator.settled) {
				this.workerMediator.sendAbortMessage();
				reject(err);
			}
		}.bind(this));

		// Start the worker process
		this.workerMediator.startWorker()
			.then(function() {
				this._emitJobForked();
			}.bind(this))
			.catch(reject);
	}.bind(this));
};

/**
 * Re-emit TrackedJob events to another EventEmitter,
 * preceding arguments with an argument for this TrackedJob instance.
 *
 * @param {EventEmitter} eventEmitter
 * @returns {TrackedJob}
 */
TrackedJob.prototype.reEmitTo = function(eventEmitter) {
	this.on(constants.EVENT_JOB_STARTED, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_STARTED, this));
	this.on(constants.EVENT_JOB_FORKED, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_FORKED, this));
	this.on(constants.EVENT_JOB_PROGRESS, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_PROGRESS, this));
	this.on(constants.EVENT_JOB_SUCCESS, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_SUCCESS, this));
	this.on(constants.EVENT_JOB_FAILURE, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_FAILURE, this));
	this.on(constants.EVENT_JOB_ABORT, eventEmitter.emit.bind(eventEmitter, constants.EVENT_JOB_ABORT, this));
	return this;
};

/**
 * Fires when the tracked job is started using {@link TrackedJob#run}.
 *
 * @event TrackedJob#jobStarted
 */
TrackedJob.prototype._emitJobStarted = function() {
	this.emit(constants.EVENT_JOB_STARTED);
};

/**
 * Fires when the tracked job forks its child worker process.
 *
 * @event TrackedJob#jobForked
 */
TrackedJob.prototype._emitJobForked = function() {
	this.emit(constants.EVENT_JOB_FORKED);
};

/**
 * Fires when the tracked job sends its 'progress'.
 *
 * @event TrackedJob#jobProgress
 * @param {*} progress
 */
TrackedJob.prototype._emitJobProgress = function(progress) {
	this.emit(constants.EVENT_JOB_PROGRESS, progress);
};

/**
 * Fires when the tracked job reports success.
 *
 * @event TrackedJob#jobSuccess
 * @param {*} result
 */
TrackedJob.prototype._emitJobSuccess = function(result) {
	this.emit(constants.EVENT_JOB_SUCCESS, result);
};

/**
 * Fires when the tracked job reports failure.
 *
 * @event TrackedJob#jobFailure
 * @param {Error} error
 */
TrackedJob.prototype._emitJobFailure = function(error) {
	this.emit(constants.EVENT_JOB_FAILURE, error);
};

/**
 * Fires when the tracked job is attempted to be aborted.
 *
 * @event TrackedJob#jobAbort
 * @param {string} abortReason
 */
TrackedJob.prototype._emitAbort = function(abortReason) {
	this.emit(constants.EVENT_JOB_ABORT, abortReason);
};

/**
 * Intercepts creation of the {@link JobWorkerMediator} set to {@link TrackedJob#workerMediator}.
 *
 * @protected
 * @function createWorkerMediator
 * @param {TrackedJob} trackedJob
 * @param {function} next
 * @this TrackedJob
 * @returns {JobWorkerMediator} - Implementation of {@link JobWorkerMediator}, which is {@link JobWorkerIPCMediator} by default.
 * @category middleware
 * @example
 * ```javascript
 * hub.addSyncMiddleware('createWorkerMediator', function(trackedJob, next) {
 *     // Return a custom implementation that runs jobs on remote servers
 *     return RemoteJobMediator(trackedJob);
 * });
 * ```
 */
