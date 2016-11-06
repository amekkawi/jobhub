var inherits = require('util').inherits;
var constants = require('./constants');
var util = require('./util');
var JobWorker = require('./JobWorker');
var hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = JobWorkerIPC;

/**
 * Responsible for running the job in the forked worker process,
 * receiving configuration and sending events via an IPC messages
 *
 * @augments {JobWorker}
 * @class
 */
function JobWorkerIPC() {
	this.payloadMessageTimeout = 20000;
	this.attachIPCChecks();
	this.watchUncaughtException();

	JobWorker.call(this);
}

inherits(JobWorkerIPC, JobWorker);

JobWorkerIPC.prototype.init = function() {
	return this.requestIPCPayload()
		.then(function(message) {
			if (hasOwnProperty.call(message, 'options')) {
				this.options = message.options;
			}

			if (message.job) {
				['jobId', 'jobName', 'params'].forEach(function(prop) {
					if (hasOwnProperty.call(message.job, prop)) {
						this[prop] = message.job[prop];
					}
				}.bind(this));
			}

			// Start the job
			return JobWorker.prototype.init.call(this);
		}.bind(this));
};

/**
 * Request the job payload via IPC, deferring the start of the job until after it is received
 *
 * @protected
 * @returns {Promise}
 */
JobWorkerIPC.prototype.requestIPCPayload = function() {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			reject(new Error('Timeout for receiving JOB_MESSAGE_PAYLOAD IPC message'));
		}, this.payloadMessageTimeout).unref();

		// Listen for messages from manager process
		process.on('message', function callback(message) {
			if (message && message.type === constants.JOB_MESSAGE_PAYLOAD) {
				process.removeListener('message', callback);
				resolve(message);
			}
		});

		// Notify manager that job has initialized and is waiting for params
		process.send({
			type: constants.JOB_MESSAGE_STARTUP
		}, function(err) {
			if (err) {
				err.message = 'Failed to send JOB_MESSAGE_STARTUP: ' + err.message;
				reject(err);
			}
		});
	}.bind(this));
};

/**
 * Check that the IPC connection is valid and listen for a disconnect
 *
 * @protected
 */
JobWorkerIPC.prototype.attachIPCChecks = function() {
	// Fail if process not started as node fork
	if (!process.send) {
		this.handleError(new Error('Job worker process must be called as forked node child process'));
	}

	// Fail if IPC channel is already disconnected
	else if (!process.connected) {
		this.handleError(new Error('Job worker process started with disconnected IPC channel'));
	}

	else {
		// Fail if IPC channel is disconnected
		process.on('disconnect', this._disconnectListener = function() {
			this.handleError(new Error('Job worker process lost connection to manager process. Exiting...'));
		}.bind(this));
	}
};

/**
 * Remove IPC checks (i.e. listening for 'disconnect')
 *
 * @protected
 */
JobWorkerIPC.prototype.detachIPCChecks = function() {
	process.removeListener('disconnect', this._disconnectListener);
};

/**
 * Catch uncaught exceptions and pass them to {@link JobWorkerIPC#handleError}
 *
 * @protected
 */
JobWorkerIPC.prototype.watchUncaughtException = function() {
	process.on('uncaughtException', this.handleError.bind(this));
};

/**
 * Called on successful execution of the job, sending an IPC message if still connected
 *
 * @protected
 * @param {*} result
 * @param {function} [errback] - Optional errback called after handling the event, optionally with an error as first arg
 */
JobWorkerIPC.prototype.handleSuccess = function(result, errback) {
	this.detachIPCChecks();
	if (process.connected) {
		process.send({
			type: constants.JOB_MESSAGE_SUCCESS,
			result: result
		}, errback);
	}
	else {
		errback && errback();
	}
};

/**
 * Called when the job fails due to an error, sending an IPC message if still connected
 *
 * @protected
 * @param {Error} err
 * @param {function} [errback] - Optional errback called after handling the event, optionally with an error as first arg
 */
JobWorkerIPC.prototype.handleError = function(err, errback) {
	this.detachIPCChecks();
	if (process.connected) {
		process.send({
			type: constants.JOB_MESSAGE_ERROR,
			error: util.dehydrateError(err)
		}, errback);
	}
	else {
		errback && errback();
	}
};

/**
 * Called when the job sends progress, sending an IPC message if still connected
 *
 * @protected
 * @param {*} progress
 * @returns {Promise} Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message
 */
JobWorkerIPC.prototype.handleProgress = function(progress) {
	return new Promise(function(resolve, reject) {
		if (process.connected) {
			process.send({
				type: constants.JOB_MESSAGE_PROGRESS,
				progress: progress
			}, function(err) {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		}
		else {
			resolve();
		}
	});
};
