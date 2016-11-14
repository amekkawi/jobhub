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
exports.JobWorkerHandlerError = JobWorkerHandlerError;

/**
 * @classdesc An InvalidManagerOptionsError object indicates an error
 * with the options provided to {@link HubManager}.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} message - The error message.
 * @param {string} propName - The option this error is for.
 * @property {string} propName - The option this error is for.
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
 * @classdesc A JobAlreadyExistsError object indicates that a job config
 * has already been registered for a specific name.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} jobName - The name of the job.
 * @property {string} jobName - The name of the job.
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
 * @classdesc A JobNotFoundError object indicates that a job config
 * could not be found for a specific name.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} jobName - The name of the job.
 * @property {string} jobName - The name of the job.
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
 * @classdesc An InvalidJobConfigError object indicates that a {@link JobConfig} has
 * an invalid value for a specific property.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} message - The error message.
 * @param {string} jobName - The name of the job.
 * @param {string} propName - The name of the job config property.
 * @property {string} jobName - The name of the job.
 * @property {string} propName - The name of the job config property.
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
 * @classdesc An InvalidUniqueKeyError object indicates that a {@link JobConfig#uniqueKey} returned an invalid value.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} keyValue - The value of the invalid key.
 * @param {string} jobName - The name of the job.
 * @property {string} keyValue - The invalid unique key value.
 * @property {string} jobName - The name of the job.
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
 * @classdesc A JobForkError object indicates that a forked job encountered an error.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} message - The error message.
 * @param {string} jobName - The name of the job.
 * @param {string} jobId - The job's ID.
 * @param {object} [options] - Additional detail to include with the error.
 * @param {object|Error|void} [options.error] - Error detail, if applicable.
 * @param {number|void} [options.code] - Process exit code, if applicable.
 * @param {string|void} [options.signal] - Process exit signal, if applicable.
 * @property {string} jobName - The name of the job.
 * @property {string} jobId - The job's ID.
 * @property {object|Error|void} error - Error detail, if applicable.
 * @property {number|void} code - Process exit code, if applicable.
 * @property {string|void} signal - Process exit signal, if applicable.
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
 * @classdesc A InvalidJobParamError object indicates that params
 * did not validate for a specific {@link JobConfig}.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {string} message - The error message.
 * @param {string} [paramName] - The name of the invalid param, if applicable.
 * @param {string} [paramValue] - The value of the invalid param, if applicable.
 * @property {string} message - The error message.
 * @property {string|void} paramName - The name of the invalid param, if applicable.
 * @property {string|void} paramValue - The value of the invalid param, if applicable.
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
 * @classdesc A UnsupportedMiddlewareTypeError object indicates that middleware
 * was attempted to be used that is not supported.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {boolean} isAsync - Indicates if the async or sync middleware.
 * @param {string} type - The type identifier of the middleware.
 * @property {boolean} isAsync - Indicates if the async or sync middleware.
 * @property {string} type - The type identifier of the middleware.
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

/**
 * @classdesc A JobWorkerHandlerError indicates that an error was caught
 * while handling the successful or failed result of a job.
 *
 * @class
 * @static
 * @category errors
 * @augments Error
 * @param {JobWorkerHandlerError.TYPES} type - Identifies if the error was caught during a success or error handler.
 * @param {Error|object} original - The successful result or the original Error.
 * @param {Error} error - The error that was caught while handling success.
 */
function JobWorkerHandlerError(type, original, error) {
	if (Error.captureStackTrace && !isStrict) {
		Error.captureStackTrace(this, arguments.callee);
	}
	else {
		this.stack = (new Error()).stack;
	}
	this.name = 'JobWorkerHandlerError';
	this.type = type;
	this.message = 'Failed to process successful result of job';
	this.original = original;

	// TODO: This may not convert properly to JSON
	this.error = error;
}
JobWorkerHandlerError.prototype = Object.create(Error.prototype);

/**
 * Values for {@link JobWorkerHandlerError}#type.
 *
 * @static
 * @memberof JobWorkerHandlerError
 * @enum {string}
 */
JobWorkerHandlerError.TYPES = {
	SUCCESS: 'SUCCESS',
	ERROR: 'ERROR'
};
