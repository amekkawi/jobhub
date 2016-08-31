/* eslint-disable no-console,valid-jsdoc */

/**
 * Job that adds two numbers
 */
exports.add = {
	run: function(job) {
		console.log('[WORKER] Running "add" in process pid:' + process.pid);
		job.resolve(job.params ? job.params.base + job.params.add : null);
	}
};

/**
 * Job that validates params and always tries to resolve quickly in the manager process
 */
exports.multiply = {
	validate: function(params, InvalidJobParamError) {
		// Verify params is an object since it can be any value (e.g. objects, arrays, strings, null, undefined)
		if (!params || typeof params !== 'object') {
			throw new InvalidJobParamError('params are required and must be an object');
		}

		// Verify both params are valid numbers
		if (typeof params.base !== 'number' || !isFinite(params.base)) {
			throw new InvalidJobParamError('"base" must be a finite number', 'base', params.base);
		}
		if (typeof params.factor !== 'number' || !isFinite(params.factor)) {
			throw new InvalidJobParamError('"factor" must be a finite number', 'factor', params.factor);
		}
	},

	/**
	 * @param {JobRunArg} job
	 */
	quickRun: function(job) {
		// Always resolve in the manager process if a quick run is attempted
		job.resolve(job.params.base * job.params.factor);
	},

	/**
	 * @param {JobRunArg} job
	 */
	run: function(job) {
		console.log('[WORKER] Running "multiply" in process pid:' + process.pid);

		// Duplicate the behavior in "run" to fully support the job API
		job.resolve(job.params.base * job.params.factor);
	}
};
