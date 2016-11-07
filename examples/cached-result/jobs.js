/* eslint-disable no-console,valid-jsdoc */

// eslint-disable-next-line no-undef
var cacheStorage = typeof global.WeakMap === 'function' && new WeakMap();

/**
 * Job that sorts a large array and gives the first and last values
 *
 * The result is cached so that future calls do not start a worker process
 */
exports.sortedFirstLast = {
	/**
	 * @param {JobConfig_JobArg} job
	 * @param {function} next
	 */
	quickRun: function(job, next) {
		// Note: "this" will point to the specific instance of JobConfig used by a HubManager

		// Retrieve cached value, if exists
		var entry = cacheStorage
			? cacheStorage.get(this)
			: this.__cache;

		if (entry) {
			job.resolve(entry);
		}
		else {
			next();
		}
	},

	onResolve: function(result, stage) {
		// Note: "this" will point to the specific instance of JobConfig used by a HubManager

		// Only cache if the job was run in a worker process,
		// and was not from a quickRun (in which case stage would be 'quickRun')
		if (stage === 'run') {
			if (cacheStorage) {
				cacheStorage.set(this, Object.assign({ __fromCache: true }, result));
			}
			else {
				Object.defineProperty(this, '__cache', {
					configurable: true,
					enumerable: false,
					writable: true,
					value: Object.assign({ __fromCache: true }, result)
				});
			}
		}
	},

	/**
	 * @param {JobConfig_JobArg} job
	 */
	run: function(job) {
		// Placing require() statements in run method avoids loading them in the manager process
		var path = require('path');
		var fs = require('fs');

		new Promise(function(resolve, reject) {
			fs.readFile(path.join(__dirname, 'big.json'), { encoding: 'utf8' }, function(err, data) {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		})
			.catch(function(err) {
				err.message = 'Failed to load big.json -- ' + err.message;
				throw err;
			})
			.then(function(data) {
				try {
					return JSON.parse(data);
				}
				catch (err) {
					err.message = 'Failed to parse big.json -- ' + err.message;
					throw err;
				}
			})
			.then(function(json) {
				if (!Array.isArray(json)) {
					throw new Error('big.json must be an array');
				}
				else {
					json.sort();
					return {
						first: json[0],
						last: json[json.length - 1]
					};
				}
			})
			.then(job.resolve, job.reject);
	}
};
