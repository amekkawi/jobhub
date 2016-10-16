var isStrict = (function() {
	return !this;
})();

exports.InvalidManagerOptionsError = InvalidManagerOptionsError;
exports.JobAlreadyExistsError = JobAlreadyExistsError;
exports.JobNotFoundError = JobNotFoundError;
exports.InvalidJobConfigError = InvalidJobConfigError;
//exports.InvalidWorkerPayloadError = InvalidWorkerPayloadError;
exports.InvalidUniqueKeyError = InvalidUniqueKeyError;
exports.JobForkError = JobForkError;
exports.InvalidJobParamError = InvalidJobParamError;
exports.UnsupportedMiddlewareTypeError = UnsupportedMiddlewareTypeError;

/**
 * An InvalidManagerOptionsError object indicates an error
 * with the options provided to {@link HubManager}
 *
 * @param {string} message
 * @param {string} propName
 * @property {string} propName - The option this error is for
 * @class
 */
function InvalidManagerOptionsError(message, propName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'InvalidManagerOptionsError';
	this.message = message;
	this.propName = propName;
}
InvalidManagerOptionsError.prototype = Object.create(Error.prototype);

/**
 * A JobAlreadyExistsError object indicates that a job config
 * has already been registered for a specific name
 *
 * @param {string} jobName
 * @property {string} jobName - The name of the job
 * @class
 */
function JobAlreadyExistsError(jobName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'JobAlreadyExistsError';
	this.message = 'Job ' + JSON.stringify(jobName) + ' has already been registered';
	this.jobName = jobName;
}
JobAlreadyExistsError.prototype = Object.create(Error.prototype);

/**
 * A JobNotFoundError object indicates that a job config
 * could not be found for a specific name
 *
 * @param {string} jobName
 * @property {string} jobName - The name of the job
 * @class
 */
function JobNotFoundError(jobName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'JobNotFoundError';
	this.message = 'Job ' + JSON.stringify(jobName) + ' is not registered';
	this.jobName = jobName;
}
JobNotFoundError.prototype = Object.create(Error.prototype);

/**
 * An InvalidJobConfigError object indicates that a {@link JobConfig} has
 * an invalid value for a specific property
 *
 * @param {string} message
 * @param {string} jobName
 * @param {string} propName
 * @property {string} jobName - The name of the job
 * @property {string} propName - The name of the job config property
 * @class
 */
function InvalidJobConfigError(message, jobName, propName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'InvalidJobConfigError';
	this.message = message;
	this.jobName = jobName;
	this.propName = propName;
}
InvalidJobConfigError.prototype = Object.create(Error.prototype);

/*function InvalidWorkerPayloadError(message, propName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'InvalidWorkerPayloadError';
	this.message = message;
	this.propName = propName;
}
InvalidWorkerPayloadError.prototype = Object.create(Error.prototype);*/

/**
 * An InvalidUniqueKeyError object indicates that a
 * {@link JobConfig_uniqueKey} returned an invalid value
 *
 * @param {string} keyValue
 * @param {string} jobName
 * @property {string} keyValue - The invalid unique key value
 * @property {string} jobName - The name of the job
 * @class
 */
function InvalidUniqueKeyError(keyValue, jobName) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'InvalidUniqueKeyError';
	this.message = 'Job ' + JSON.stringify(jobName) + ' must return a string, null or undefined from uniqueKey (returned ' + typeof keyValue + ')';
	this.jobName = jobName;
	this.keyValue = keyValue;
}
InvalidUniqueKeyError.prototype = Object.create(Error.prototype);

/**
 * @typedef {object} JobForkError~options
 * @property {object|Error|undefined} error - Error detail, if applicable
 * @property {number|undefined} code - Process exit code, if applicable
 * @property {string|undefined} signal - Process exit signal, if applicable
 */

/**
 * A JobForkError object indicates that a forked job encountered an error
 *
 * @param {string} message
 * @param {string} jobName
 * @param {string} jobId
 * @param {JobForkError~options} [options]
 * @property {string} jobName
 * @property {string} jobId
 * @property {object|Error|undefined} error - Error detail, if applicable
 * @property {string|undefined} stack - Error call stack, if applicable
 * @property {number|undefined} code - Process exit code, if applicable
 * @property {string|undefined} signal - Process exit signal, if applicable
 * @class
 */
function JobForkError(message, jobName, jobId, options) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'JobForkError';
	this.message = message;
	this.jobName = jobName;
	this.jobId = jobId;
	if (options) {
		if (typeof options.error !== 'undefined') {
			this.error = options.error;
			if (this.error && this.error.stack) {
				this.stack = this.error.stack;
			}
		}
		if (typeof options.code !== 'undefined') {
			this.code = options.code;
		}
		if (typeof options.signal !== 'undefined') {
			this.signal = options.signal;
		}
	}
}
JobForkError.prototype = Object.create(Error.prototype);

/**
 * A InvalidJobParamError object indicates that params
 * did not validate for a specific {@link JobConfig}
 *
 * @param {string} message - The error message
 * @param {string} [paramName] - The name of the invalid param, if applicable
 * @param {string} [paramValue] - The value of the invalid param, if applicable
 * @property {string} message - The error message
 * @property {string|undefined} paramName - The name of the invalid param, if applicable
 * @property {string|undefined} paramValue - The value of the invalid param, if applicable
 * @class
 */
function InvalidJobParamError(message, paramName, paramValue) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'InvalidJobParamError';
	this.message = message;
	if (arguments.length >= 2) {
		this.paramName = paramName;
		if (arguments.length >= 3) {
			this.paramValue = paramValue;
		}
	}
}
InvalidJobParamError.prototype = Object.create(Error.prototype);

/**
 * A UnsupportedMiddlewareTypeError object indicates that middleware
 * was attempted to be used that is not supported
 *
 * @param {boolean} isAsync - Indicates if the async or sync middleware
 * @param {string} type - The type identifier of the middleware
 * @property {boolean} isAsync - Indicates if the async or sync middleware
 * @property {string} type - The type identifier of the middleware
 * @class
 */
function UnsupportedMiddlewareTypeError(isAsync, type) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'UnsupportedMiddlewareTypeError';
	this.message = 'Unsupported ' + (isAsync ? 'async' : 'sync') + ' middleware type: ' + JSON.stringify(type);
	this.isAsync = isAsync;
	this.type = type;
}
UnsupportedMiddlewareTypeError.prototype = Object.create(Error.prototype);
