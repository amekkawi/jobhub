var inherits = require('util').inherits;
var constants = require('./constants');
var util = require('./util');
var JobWorker = require('./JobWorker');
var hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = JobWorkerIPC;

/**
 * Responsible for running the job in the forked worker process,
 * receiving params via an IPC message
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

JobWorkerIPC.prototype.detachIPCChecks = function() {
	process.removeListener('disconnect', this._disconnectListener);
};

JobWorkerIPC.prototype.watchUncaughtException = function() {
	process.on('uncaughtException', this.handleError.bind(this));
};

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

JobWorkerIPC.prototype.handleProgress = function(progress, errback) {
	if (process.connected) {
		process.send({
			type: constants.JOB_MESSAGE_PROGRESS,
			progress: progress
		}, errback);
	}
	else {
		// Do nothing for progress calls if IPC is not connected
		errback && errback();
	}
};
