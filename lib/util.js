var createUUID = require('uuid').v4;
var path = require('path');
var constants = require('./constants');
var errors = require('./errors');
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * @typedef {object} TrackedJob~JobArg
 * @property {string} jobId
 * @property {*} params
 * @property {function} resolve - Call with an optional single argument to resolve the job
 * @property {function} reject - Call with a single Error argument to reject the job
 * @property {function} sendProgress - Call with a single argument to send progress updates
 */

/**
 * @callback JobConfig~quickRun
 * @param {TrackedJob~JobArg} job
 * @param {function} next - Call to skip "quickRun", continuing to "run" the worker
 */

/**
 * @callback JobConfig~run
 * @param {TrackedJob~JobArg} job
 */

/**
 * @callback JobConfig~uniqueKey
 * @param {*} params
 */

/**
 * @callback JobConfig~validate
 * @param {*} params
 * @param {InvalidJobParamError} InvalidJobParamError - Error constructor that should be used to throw validation errors
 */

/**
 * @callback JobConfig~onSuccess
 * @param {*} result
 * @param {TrackedJob} trackedJob
 */

/**
 * @callback JobConfig~onFailure
 * @param {Error} err
 * @param {TrackedJob} trackedJob
 */

/**
 * @callback JobConfig~onProgress
 * @param {*} progress
 * @param {TrackedJob} trackedJob
 */

/**
 * @typedef {object} JobConfig
 * @property {string} jobName
 * @property {JobConfig~run} run
 * @property {JobConfig~quickRun} [quickRun=null]
 * @property {boolean} [unique=false]
 * @property {JobConfig~uniqueKey} [uniqueKey=null]
 * @property {JobConfig~validate} [validate=null]
 * @property {JobConfig~onSuccess} [onSuccess=null]
 * @property {JobConfig~onFailure} [onFailure=null]
 * @property {JobConfig~onProgress} [onProgress=null]
 * @property {object} [meta={}]
 */

/**
 * @typedef {object} HubManagerOptions
 * @property {string} jobsModulePath
 * @property {string} [forkInitModulePath]
 * @property {string} [forkModulePath]
 * @property {number} [terminationSIGTERMTimeout=60000]
 * @property {number} [terminationSIGKILLTimeout=60000]
 * @property {number} [workerStartupTimeout=20000]
 * @property {function} [createId=require('uuid').v4]
 */

/**
 * @typedef {object} JobWorkerPayload
 * @property {HubManagerOptions} options
 * @property {*} params
 */

exports.getDefaultManagerOptions = function() {
	return {
		forkModulePath: path.resolve(__dirname, 'worker.js'),
		forkInitModulePath: null,
		jobsModulePath: null,
		terminationSIGTERMTimeout: 60000,
		terminationSIGKILLTimeout: 60000,
		workerStartupTimeout: 20000,
		createId: createUUID
	};
};

/**
 * Validate and normalize the manager options
 *
 * @param {object} options
 * @param {HubManagerOptions} defaultOptions
 * @returns {HubManagerOptions}
 */
exports.parseManagerOptions = function(options, defaultOptions) {
	options = Object.keys(defaultOptions).reduce(function(ret, key) {
		if (options && hasOwnProperty.call(options, key)) {
			ret[key] = options[key];
		}
		else {
			ret[key] = defaultOptions[key];
		}
		return ret;
	}, {});

	if (options.forkInitModulePath && typeof options.forkInitModulePath !== 'string') {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "forkInitModulePath" option must be a string, if specified',
			'forkInitModulePath'
		);
	}

	if (typeof options.jobsModulePath !== 'string') {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "jobsModulePath" option must be a string',
			'jobsModulePath'
		);
	}

	if (typeof options.forkModulePath !== 'string') {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "forkModulePath" option must be a string',
			'forkModulePath'
		);
	}

	if (typeof options.terminationSIGTERMTimeout !== 'number' || !isFinite(options.terminationSIGTERMTimeout) || options.terminationSIGTERMTimeout < 0) {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "terminationSIGTERMTimeout" option must be number greater than or equal to zero',
			'terminationSIGTERMTimeout'
		);
	}

	if (typeof options.terminationSIGKILLTimeout !== 'number' || !isFinite(options.terminationSIGKILLTimeout) || options.terminationSIGKILLTimeout < 0) {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "terminationSIGKILLTimeout" option must be number greater than or equal to zero',
			'terminationSIGKILLTimeout'
		);
	}

	if (typeof options.workerStartupTimeout !== 'number' || !isFinite(options.workerStartupTimeout) || options.workerStartupTimeout < 0) {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "workerStartupTimeout" option must be number greater than or equal to zero',
			'workerStartupTimeout'
		);
	}

	if (typeof options.createId !== 'function') {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "createId" option must be a function',
			'createId'
		);
	}

	return options;
};

/**
 * Validate and normalize the config for a job
 *
 * @param {string} jobName
 * @param {object} jobConfig
 * @returns {JobConfig}
 * @throws {InvalidJobConfigError}
 */
exports.parseJobConfig = function(jobName, jobConfig) {
	if (typeof jobName !== 'string') {
		throw new Error('First argument of parseJobConfig must be a string');
	}

	if (typeof jobConfig === 'function') {
		jobConfig = {
			run: jobConfig
		};
	}
	else if (jobConfig && typeof jobConfig === 'object') {
		if (!jobConfig.run) {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config is missing "run"',
				jobName,
				'run'
			);
		}
		if (typeof jobConfig.run !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "run"',
				jobName,
				'run'
			);
		}
		if (jobConfig.quickRun && typeof jobConfig.quickRun !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "quickRun", if specified',
				jobName,
				'quickRun'
			);
		}
		if (jobConfig.uniqueKey && typeof jobConfig.uniqueKey !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "uniqueKey", if specified',
				jobName,
				'uniqueKey'
			);
		}
		if (jobConfig.validate && typeof jobConfig.validate !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "validate", if specified',
				jobName,
				'validate'
			);
		}
		if (jobConfig.onSuccess && typeof jobConfig.onSuccess !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "onSuccess", if specified',
				jobName,
				'onSuccess'
			);
		}
		if (jobConfig.onFailure && typeof jobConfig.onFailure !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "onFailure", if specified',
				jobName,
				'onFailure'
			);
		}
		if (jobConfig.onProgress && typeof jobConfig.onProgress !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "onProgress", if specified',
				jobName,
				'onProgress'
			);
		}
		if (jobConfig.meta && typeof jobConfig.meta !== 'object') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have an object for "meta", if specified',
				jobName,
				'meta'
			);
		}
	}
	else {
		throw new errors.InvalidJobConfigError(
			'Job ' + JSON.stringify(jobName) + ' config must be a function or object (JobConfig)',
			jobName
		);
	}

	// Recreate clean config
	return {
		jobName: jobName,
		run: jobConfig.run,
		quickRun: jobConfig.quickRun || null,
		unique: !!jobConfig.unique || !!jobConfig.uniqueKey,
		uniqueKey: jobConfig.uniqueKey || null,
		validate: jobConfig.validate || null,
		onSuccess: jobConfig.onSuccess || null,
		onFailure: jobConfig.onFailure || null,
		onProgress: jobConfig.onProgress || null,
		meta: jobConfig.meta || {}
	};
};

/**
 * Get the key to identify unique tracked jobs, or null if a job does not have uniqueness.
 *
 * @param {JobConfig} jobConfig
 * @param {*} params
 * @returns {string|null}
 * @throws {InvalidUniqueKeyError}
 */
exports.getUniqueKey = function(jobConfig, params) {
	if (jobConfig.uniqueKey) {
		// Allow the config to generate a key
		var key = jobConfig.uniqueKey(params);

		if (key != null) {
			// Verify the returned key is valid
			if (typeof key !== 'string') {
				throw new errors.InvalidUniqueKeyError(key, jobConfig.jobName);
			}
			return key;
		}
	}

	// Use the built-in key if globally unique
	else if (jobConfig.unique) {
		return constants.UNIQUE_KEY;
	}

	return null;
};

/**
 * Validate params for a job using optional 'validate' method in JobConfig
 *
 * 'validate' should throw errors or return a Promise for async validation
 *
 * @param {JobConfig} jobConfig
 * @param {*} params
 * @returns {Promise}
 */
exports.validateJobParams = function(jobConfig, params) {
	if (!jobConfig.validate) {
		return Promise.resolve();
	}

	// Wrap in Promise to catch sync errors
	return new Promise(function(resolve) {
		resolve(jobConfig.validate(params, errors.InvalidJobParamError));
	});
};

/**
 * Wrap a series of callbacks so once one is called, calls to the others are ignored
 *
 * @param {function} fn
 * @param {...function} callbacks - two or more callbacks
 * @returns {*}
 */
exports.onlyOneCallback = function(fn, callbacks) { // eslint-disable-line no-unused-vars
	if (arguments.length < 3) {
		throw Error('onlyOneCallback must have at least 3 arguments');
	}

	var fulfilled = false;

	return fn.apply(
		this,
		Array.prototype.slice.call(arguments, 1)
			.map(wrapCallback)
	);

	function wrapCallback(cb) {
		if (typeof cb !== 'function') {
			throw Error('All arguments to onlyOneCallback must be functions');
		}

		return function() {
			if (!fulfilled) {
				fulfilled = true;
				cb.apply(this, arguments);
			}
		};
	}
};

/**
 * Promise helper to catch errors thrown by fn and pass them to reject
 *
 * @param {function} reject
 * @param {function} fn
 * @returns {function}
 */
exports.rejectOnThrow = function(reject, fn) {
	return function() {
		try {
			return fn.apply(this, arguments);
		}
		catch (err) {
			reject(err);
		}
	};
};

/**
 * Extract non-object own props from an Error
 *
 * @param {Error} err
 * @returns {object}
 */
exports.dehydrateError = function(err) {
	if (typeof err === 'string') {
		return {
			message: err
		};
	}

	var props = Object.getOwnPropertyNames(err);
	return props.reduce(function(ret, prop) {
		if (err[prop] == null || typeof err[prop] !== 'object') {
			ret[prop] = err[prop];
		}
		return ret;
	}, {});
};

/**
 * @param {function} fn
 * @returns {Promise}
 */
exports.promiseTry = function(fn) {
	return Promise.resolve().then(fn);
};
