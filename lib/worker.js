/**
 * @module worker
 * @protected
 */

var minimist = require('minimist');
var JobWorker = require('./JobWorker');
var JobWorkerIPC = require('./JobWorkerIPC');

exports.cliFactory = cliFactory;
exports.main = main;

if (require.main === module) {
	main(cliFactory(process.argv.slice(2)));
}

/**
 * Start a CLI worker with the specified CLI arguments.
 *
 * @protected
 * @param {JobWorker} jobWorker
 */
function main(jobWorker) {
	jobWorker.start()
		.then(function() {
			exitAfterTimeout(process.exitCode = 0);
		}, function() {
			exitAfterTimeout(process.exitCode = 1);
		});
}

/**
 * Create an instance of JobWorker.
 *
 * @protected
 * @param {string[]} argv
 * @returns {JobWorker}
 */
function cliFactory(argv) {
	var cliArgs = minimist(argv, {
		'--': false,
		string: ['jobName', 'jobId', 'params', 'options'],
		boolean: ['useIPC']
	});

	// Get the job name from the CLI args, and fail if not found
	var jobId = cliArgs.jobId;
	var jobName = cliArgs.jobName;
	var params = cliArgs.params;
	var options = cliArgs.options;
	var useIPC = cliArgs.useIPC;

	if (useIPC) {
		return new JobWorkerIPC();
	}
	else {
		return new JobWorker(jobId, jobName, params, options);
	}
}

/**
 * Exit with the specified code after a timeout.
 *
 * @private
 * @param {number} status
 */
function exitAfterTimeout(status) {
	setTimeout(function() {
		// TODO: Add warning?
		process.exit(status || 0);
	}, 20000).unref();
}
