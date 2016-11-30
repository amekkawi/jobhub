/* eslint-disable no-console,valid-jsdoc */

exports.stallingValidation = {
	validate: function() {
		console.log('[JOB] Running validate for "stallingValidation"');

		return new Promise(function(){
			// Never resolves
		});
	},
	run: function(job) {

	}
}

exports.stallingQuickRun = {
	quickRun: function(job) {
		console.log('[JOB] Running quickRun for "stallingQuickRun"');

		job.onAbort(function() {
			console.log('[JOB] Uh oh! "stallingQuickRun" notified of an abort! Better do some cleanup...');
		});

		// Never resolves
	},
	run: function(job) {

	}
};

exports.stallingRun = function(job) {
	console.log('[JOB] Running "stallingRun" in process pid:' + process.pid);

	job.onAbort(function() {
		console.log('[JOB] Uh oh! "stallingRun" notified of an abort! Better do some cleanup...');

		// Reject to shutdown worker process immediately.
		job.reject(new Error());
	});

	// Never resolves
};
