var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var constants = require('./constants');
var util = require('./util');
var JobWorkerIPCMediator = require('./JobWorkerIPCMediator');

module.exports = TrackedJob;

/**
 * @classdesc Tracks a job that has not yet completed.
 *
 * @class
 * @augments {EventEmitter}
 * @param {HubManager} manager
 * @param {string} jobId - ID for the tracked job.
 * @param {JobConfig} jobConfig
 * @param {*} [params]
 * @fires TrackedJob#jobStarted
 * @fires TrackedJob#jobForked
 * @fires TrackedJob#jobProgress
 * @fires TrackedJob#jobSuccess
 * @fires TrackedJob#jobFailure
 */
function TrackedJob(manager, jobId, jobConfig, params) {
	EventEmitter.call(this);

	/**
	 * When the TrackedJob was created.
	 *
	 * @member {Date} TrackedJob#created
	 */
	this.created = new Date();

	/**
	 * TODO
	 * null until run is called, after which it is the name of the stage of running a job that is executing,
	 * or for a job that resolved/rejected it is the stage that was run just before resolving or rejecting.
	 *
	 * @member {string|null} TrackedJob#stage
	 */
	this.stage = null;

	/**
	 * TODO
	 * @member {HubManager} TrackedJob#manager
	 */
	this.manager = manager;

	/**
	 * ID for the tracked job.
	 *
	 * @member {string} TrackedJob#jobId
	 */
	this.jobId = jobId;

	/**
	 * @member {JobConfig} TrackedJob#jobConfig
	 */
	this.jobConfig = jobConfig;

	/**
	 * Parameters passed to the job handler.
	 *
	 * @member {*} TrackedJob#params
	 */
	this.params = params;

	/**
	 * true once run() is called and false after the job succeeds or fails.
	 *
	 * @member {boolean} TrackedJob#isRunning
	 */
	this.isRunning = false;

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
	 * The last emitted progress value.
	 *
	 * @member {*} TrackedJob#progress
	 */
	this.progress = null;
}

// TrackedJob extends EventEmitter
inherits(TrackedJob, EventEmitter);

/**
 * Convinence method for `TrackedJob.promise.then`.
 *
 * Only usable after {@link TrackedJob#run} is called.
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
 * Convinence method for `TrackedJob.promise.catch`.
 *
 * Only usable after {@link TrackedJob#run} is called.
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
 * Start the job, if it has not already started.
 *
 * @returns {TrackedJob}
 */
TrackedJob.prototype.run = function() {
	if (!this.promise) {
		var resolveOuter;

		// Create a "outer" promise to immediately set the TrackedJob#promise property
		this.promise = new Promise(function(resolve) {
			resolveOuter = resolve;
		});

		// Create an "inner" promise which handles the actual promise chain
		var innerPromise = new Promise(function(resolve) {
			// Mark as running
			this.isRunning = true;

			// Mark as validating params
			this.stage = constants.JOB_STAGE_VALIDATE_PARAMS;

			this._emitJobStarted();

			resolve();
		}.bind(this))
			.then(function() {
				// Validate job params
				return util.validateJobParams(this.jobConfig, this.params);
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
				this._emitJobSuccess(result);
				return result;
			}.bind(this), function(err) {
				this.isRunning = false;
				this._emitJobFailure(err);
				throw err;
			}.bind(this));

		// Resolve the outer promise with the inner promise,
		// effectively injecting the inner promise chain into the outer one
		resolveOuter(innerPromise);
	}

	return this;
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
 * preceeding arguments with an argument for this TrackedJob instance.
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
	return this;
};

/**
 * Fires when the tracked job is started using {@link TrackedJob#start}.
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
