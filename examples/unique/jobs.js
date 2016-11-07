/* eslint-disable no-console,valid-jsdoc */

exports.veryUnique = {
	unique: true,

	/**
	 * @param {JobConfig_JobArg} job
	 */
	run: function(job) {
		setTimeout(function() {
			job.resolve('workerpid:' + process.pid);
		}, 1000);
	}
};

exports.kindaUnique = {
	validate: function(params, InvalidJobParamError) {
		// Verify params is an object since it can be any value (e.g. objects, arrays, strings, null, undefined)
		if (!params || typeof params !== 'object') {
			throw new InvalidJobParamError('params are required and must be an object');
		}

		// Verify both params are valid numbers
		if (typeof params.name !== 'string') {
			throw new InvalidJobParamError('"name" must be a string', 'name', params.name);
		}
	},

	uniqueKey: function(params) {
		return params.name;
	},

	/**
	 * @param {JobConfig_JobArg} job
	 */
	run: function(job) {
		setTimeout(function() {
			job.resolve('name:' + job.params.name + ' workerpid:' + process.pid);
		}, 1000);
	}
};
