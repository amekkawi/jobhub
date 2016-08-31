var isStrict = (function() {
	return !this;
})();

exports.InvalidManagerOptionsError = InvalidManagerOptionsError;
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

exports.JobAlreadyExistsError = JobAlreadyExistsError;
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

exports.JobNotFoundError = JobNotFoundError;
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

exports.InvalidJobConfigError = InvalidJobConfigError;
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

exports.InvalidWorkerPayloadError = InvalidWorkerPayloadError;
function InvalidWorkerPayloadError(message, propName) {
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
InvalidWorkerPayloadError.prototype = Object.create(Error.prototype);

exports.InvalidUniqueKeyError = InvalidUniqueKeyError;
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

exports.JobForkError = JobForkError;
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

exports.InvalidJobParamError = InvalidJobParamError;
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

exports.UnsupportedMiddlewareTypeError = UnsupportedMiddlewareTypeError;
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
