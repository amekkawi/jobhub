module.exports = JobExecutor;

/**
 * @classdesc Manages running jobs that have been queued using {@link HubManager#queueJob}.
 *
 * @class
 * @abstract
 * @param {object} options
 * @param {HubManager} manager
 */
function JobExecutor(options, manager) {
	/**
	 * @protected
	 * @member {object} JobExecutor#options
	 */
	this.options = options;

	/**
	 * @protected
	 * @member {HubManager} JobExecutor#manager
	 */
	this.manager = manager;
}

/**
 * Add a tracked job to be run.
 *
 * @abstract
 * @param {TrackedJob} trackedJob
 */
JobExecutor.prototype.add = function(trackedJob) { // eslint-disable-line no-unused-vars
	throw new Error('JobExecutor#add is abstract and must be overridden');
};

/**
 * Get detail about queued and running jobs.
 *
 * @abstract
 * @returns {object}
 */
JobExecutor.prototype.getStatus = function() {
	throw new Error('JobExecutor#getStatus is abstract and must be overridden');
};
