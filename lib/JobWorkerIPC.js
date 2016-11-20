var inherits = require('util').inherits;
var constants = require('./constants');
var util = require('./util');
var JobWorker = require('./JobWorker');
var hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = JobWorkerIPC;

/**
 * @classdesc Responsible for running the job in the forked worker process,
 * receiving configuration and sending events via an IPC messages.
 *
 * @class
 * @augments {JobWorker}
 */
function JobWorkerIPC() {
	/**
	 * @member {number} JobWorkerIPC#payloadMessageTimeout
	 * @default 20000
	 */
	this.payloadMessageTimeout = 20000;

	JobWorker.call(this);
}

inherits(JobWorkerIPC, JobWorker);

/**
 * Overrides {@link JobWorker#init} to first request the following to be sent via an IPC message:
 *
 * * {@link JobWorker#options}
 * * {@link JobWorker#jobId}
 * * {@link JobWorker#jobName}
 * * {@link JobWorker#params}
 *
 * @see {@link JobWorkerIPC#attachIPCChecks}
 * @see {@link JobWorkerIPC#watchUncaughtException}
 * @see {@link JobWorkerIPC#requestIPCPayload}
 * @returns {Promise}
 */
JobWorkerIPC.prototype.init = function() {
	return util.promiseTry(function() {
		this.attachIPCChecks();
		this.watchUncaughtException();

		return this.requestIPCPayload();
	}.bind(this))
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
 * Request the job payload via IPC, deferring the start of the job until after it is received.
 *
 * Called by {@link JobWorkerIPC#init}.
 *
 * @protected
 * @fulfil {object} Payload data that includes manager options, jobId, jobName and params.
 * @reject {Error} If timeout specified by {@link JobWorkerIPC#payloadMessageTimeout} is exceeded
 * @reject {Error} If failed to send the startup IPC message
 * @returns {Promise}
 */
JobWorkerIPC.prototype.requestIPCPayload = function() {
	return new Promise(function(resolve, reject) {
		var timeoutId = setTimeout(function() {
			this.removeListener(constants.EVENT_JOB_ABORT, abortListener);
			reject(new Error('Timeout for receiving job payload IPC message'));
		}.bind(this), this.payloadMessageTimeout).unref();

		// Temporarily listen for an abort message which may be received instead of the payload.
		this.once(constants.EVENT_JOB_ABORT, abortListener);
		function abortListener() {
			clearTimeout(timeoutId);
			reject(new Error('Received abort message before job payload'));
		}

		// Listen for messages from manager process
		this.once('ipc-message::' + constants.JOB_MESSAGE_PAYLOAD, function(payload) {
			clearTimeout(timeoutId);
			this.removeListener(constants.EVENT_JOB_ABORT, abortListener);
			resolve(payload);
		});

		// Notify manager that job has initialized and is waiting for params
		process.send({
			type: constants.JOB_MESSAGE_STARTUP
		}, function(err) {
			if (err) {
				clearTimeout(timeoutId);
				this.removeListener(constants.EVENT_JOB_ABORT, abortListener);
				err.message = 'Failed to send job startup confirmation: ' + err.message;
				reject(err);
			}
		}.bind(this));
	}.bind(this));
};

// TODO: Rename to attachToIPC in next breaking release
/**
 * Check that the IPC connection is valid and listen for IPC messages and disconnect.
 *
 * Called by {@link JobWorkerIPC#init}.
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
		process.on('disconnect', this.handleIPCDisconnect = this.handleIPCDisconnect.bind(this));
		process.on('message', this.handleIPCMessage = this.handleIPCMessage.bind(this));

		// Listen for abort message.
		this.on('ipc-message::' + constants.JOB_MESSAGE_ABORT, this.handleAbort);
	}
};

// TODO: Rename to detatchFromIPC in next breaking release
/**
 * Remove IPC listeners (i.e. listening for 'disconnect' and 'message').
 *
 * @protected
 */
JobWorkerIPC.prototype.detachIPCChecks = function() {
	process.removeListener('disconnect', this.handleIPCDisconnect);
	process.removeListener('message', this.handleIPCMessage);
};

/**
 * Catch uncaught exceptions and pass them to {@link JobWorkerIPC#handleError}.
 *
 * Called by {@link JobWorkerIPC#init}.
 *
 * @protected
 */
JobWorkerIPC.prototype.watchUncaughtException = function() {
	process.on('uncaughtException', this.handleError.bind(this));
};

/**
 * Called on successful execution of the job, sending an IPC message if still connected.
 *
 * @protected
 * @param {*} result
 * @returns {Promise} Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.
 */
JobWorkerIPC.prototype.handleSuccess = function(result) {
	return new Promise(function(resolve, reject) {
		this.detachIPCChecks();
		if (process.connected) {
			process.send({
				type: constants.JOB_MESSAGE_SUCCESS,
				result: result
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
	}.bind(this));
};

/**
 * Called when the job fails due to an error, sending an IPC message if still connected.
 *
 * @protected
 * @param {Error} err
 * @returns {Promise} Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.
 */
JobWorkerIPC.prototype.handleError = function(err) {
	return new Promise(function(resolve, reject) {
		this.detachIPCChecks();
		if (process.connected) {
			process.send({
				type: constants.JOB_MESSAGE_ERROR,
				error: util.dehydrateError(err)
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
	}.bind(this));
};

/**
 * Called when the job sends progress, sending an IPC message if still connected.
 *
 * @protected
 * @param {*} progress
 * @returns {Promise} Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.
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

/**
 * Called when the process emits a 'disconnect' event.
 *
 * @protected
 */
JobWorkerIPC.prototype.handleIPCDisconnect = function() {
	this.handleError(new Error('Job worker process lost connection to manager process. Exiting...'));
};

/**
 * Called when the process emits a 'message' event.
 *
 * If `message.type` is a string, the event is re-emitted to this instance as `` `ipc-message::${message.type}` ``.
 *
 * @protected
 * @param {*} message
 */
JobWorkerIPC.prototype.handleIPCMessage = function(message) {
	if (message && typeof message.type === 'string') {
		this.emit('ipc-message::' + message.type, message);
	}
};
