/* eslint-disable no-console,valid-jsdoc */

exports.slowJob = {
	run: function(job) {
		setTimeout(function() {
			job.resolve();
		}, 2000);
	}
};
