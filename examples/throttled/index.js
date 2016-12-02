/* eslint-disable no-console */

var path = require('path');
var jobhub = require('../../lib/index');

var verbose = process.argv.indexOf('-v') >= 0;

var hub = new jobhub.HubManager({
	jobsModulePath: path.resolve(__dirname, 'jobs.js'),
	jobExecutorOptions: {
		maxConcurrent: 2
	}
}).start();

if (verbose) {
	require('../util').logManagerEvents(hub);
}

function startSlowJob(i) {
	hub.queueJob('slowJob')
		.on('jobStarted', function() {
			console.log('[MANAGER] Job ' + i + ' started...')
		})
		.then(function() {
			console.log('[MANAGER] Job ' + i + ' success!')
		});
}

// Start 10 jobs, but only 2 should run at a time.
for (var i = 1; i <= 10; i++) {
	startSlowJob(i);
}
