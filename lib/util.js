/**
 * Helper utilities used by jobhub.
 *
 * @module jobhub/lib/util
 * @protected
 * @example
 * ```javascript
 * var util = require("jobhub/lib/util");
 * ```
 */

var createUUID = require('uuid').v4;
var path = require('path');
var constants = require('./constants');
var errors = require('./errors');
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasSetSupport = typeof global.Set !== 'undefined' && typeof new global.Set().values === 'function' && new global.Set().values().next;

/**
 * Get the default HubManager option values.
 *
 * @static
 * @returns {HubManagerOptions}
 */
exports.getDefaultManagerOptions = function() {
	return {
		forkModulePath: path.resolve(__dirname, 'worker.js'),
		initModulePath: null,
		jobsModulePath: null,
		terminationSIGTERMTimeout: 60000,
		terminationSIGKILLTimeout: 60000,
		workerStartupTimeout: 20000,
		createId: createUUID
	};
};

/**
 * Validate and normalize the manager options.
 *
 * @static
 * @param {object} options
 * @param {HubManagerOptions} defaultOptions
 * @throws {InvalidManagerOptionsError}
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

	if (options.initModulePath && typeof options.initModulePath !== 'string') {
		throw new errors.InvalidManagerOptionsError(
			'HubManager "initModulePath" option must be a string, if specified',
			'initModulePath'
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
 * Validate and normalize the config for a job.
 *
 * @static
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
		if (jobConfig.onCreate && typeof jobConfig.onCreate !== 'function') {
			throw new errors.InvalidJobConfigError(
				'Job ' + JSON.stringify(jobName) + ' config must have a function for "onCreate", if specified',
				jobName,
				'onCreate'
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
		onCreate: jobConfig.onCreate || null,
		meta: jobConfig.meta || {}
	};
};

/**
 * Get the key to identify unique tracked jobs, or null if a job does not have uniqueness.
 *
 * @static
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
 * Validate params for a job using optional 'validate' method in JobConfig.
 *
 * It should throw errors or return a Promise for async validation.
 *
 * @static
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
	})
		.then(function() {
			// Drop return value
		});
};

/**
 * Wrap a series of callbacks so once one is called, calls to the others are ignored.
 *
 * @static
 * @protected
 * @param {function} fn
 * @param {...function} callbacks - Two or more callbacks.
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
 * Promise helper to catch errors thrown by fn and pass them to reject.
 *
 * @static
 * @protected
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
 * Extract non-object own props from an Error.
 *
 * @static
 * @protected
 * @param {Error} err
 * @returns {object}
 */
exports.dehydrateError = function(err) {
	if (typeof err === 'string') {
		return {
			name: 'Error',
			message: err
		};
	}

	var baseObj = {};

	// Get common Error props
	if (typeof err.name === 'string') {
		baseObj.name = err.name;
	}
	if (typeof err.message === 'string') {
		baseObj.message = err.message;
	}

	var objSet = hasSetSupport ? new global.Set() : (function() {
		var lookup = [];
		return {
			add: function(v) {
				lookup.push(v);
			},
			has: function(v) {
				return lookup.indexOf(v) >= 0;
			}
		};
	})();

	// Add initial error to lookup just in case it's nested.
	objSet.add(err);

	return dehydrateObj(err, baseObj);

	function mapArrValue(val) {
		var type = typeof val;
		if (val == null || type === 'boolean' || type === 'string' || type === 'number') {
			return val;
		}
		else if (type === 'object') {
			if (val instanceof Error) {
				objSet.add(val);
				return exports.dehydrateError(val);
			}
			else if (Array.isArray(val) && !objSet.has(val)) {
				return val.map(mapArrValue);
			}
			else if (!(val instanceof RegExp) && !objSet.has(val)) {
				return dehydrateObj(val);
			}
		}
	}

	function dehydrateObj(obj, baseObj) {
		var props = Object.getOwnPropertyNames(obj);
		return props.reduce(function(ret, prop) {
			var val = obj[prop];
			var type = typeof val;

			if (val == null || type === 'boolean' || type === 'string' || type === 'number') {
				ret[prop] = val;
			}
			else if (type === 'object') {
				if (val instanceof Error) {
					objSet.add(val);
					ret[prop] = exports.dehydrateError(val);
				}
				else if (Array.isArray(val) && !objSet.has(val)) {
					objSet.add(val);
					ret[prop] = val.map(mapArrValue);
				}
				else if (!(val instanceof RegExp) && !objSet.has(val)) {
					objSet.add(val);
					ret[prop] = dehydrateObj(val);
				}
			}
			return ret;
		}, baseObj || {});
	}
};

/**
 * Wrap a function in a Promise to catch synchronous errors.
 *
 * @static
 * @protected
 * @param {function} fn
 * @returns {Promise}
 */
exports.promiseTry = function(fn) {
	return new Promise(function(resolve) {
		resolve(fn());
	});
};

/**
 * Polyfill for Object.values.
 *
 * @static
 * @protected
 * @type {function}
 * @param {object} obj
 * @returns {Array}
 */
exports.objectValues = function(obj) {
	return Object.keys(obj).map(function(key) {
		return obj[key];
	});
};
