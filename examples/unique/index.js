/* eslint-disable no-console */

var path = require('path');
var jobhub = require('../../lib/index');

var verbose = process.argv.indexOf('-v') >= 0;

var hub = new jobhub.HubManager({
	jobsModulePath: path.resolve(__dirname, 'jobs.js')
});

if (verbose) {
	require('../util').logManagerEvents(hub);
}

// Queue the first job (which takes 1 second to run)
hub.queueJob('veryUnique')
	.then(function(result) {
		console.log('[MANAGER] Success veryUnique A result:%s', JSON.stringify(result));

		// Queue job again now that the first has completed, which will give us a new JobTracker instance
		// since an existing "unique" job is no longer running.
		hub.queueJob('veryUnique')
			.then(function(result) {
				console.log('[MANAGER] Success veryUnique C result:%s', JSON.stringify(result));
			}, function(err) {
				console.error('[MANAGER] Failed veryUnique C result:%s', err.stack);
			});
	}, function(err) {
		console.error('[MANAGER] Failed veryUnique A: %s', err.stack);
	});

// Immediately queue the job again, but since it is unique and the other is still
// running, queueJob will return the same JobTracker instance
hub.queueJob('veryUnique')
	.then(function(result) {
		console.log('[MANAGER] Success veryUnique B result:%s', JSON.stringify(result));
	}, function(err) {
		console.error('[MANAGER] Failed veryUnique B result:%s', err.stack);
	});

// Queue the first job (which takes 1 second to run)
hub.queueJob('kindaUnique', { name: 'Foo' })
	.then(function(result) {
		console.log('[MANAGER] Success kindaUnique A result:%s', JSON.stringify(result));
	}, function(err) {
		console.error('[MANAGER] Failed kindaUnique A: %s', err.stack);
	});

// Immediately queue the job again, but since it is unique and the other is still
// running, queueJob will return the same JobTracker instance
hub.queueJob('kindaUnique', { name: 'Foo' })
	.then(function(result) {
		console.log('[MANAGER] Success kindaUnique B result:%s', JSON.stringify(result));
	}, function(err) {
		console.error('[MANAGER] Failed kindaUnique B result:%s', err.stack);
	});

// Immediately queue the job again but with a different name
hub.queueJob('kindaUnique', { name: 'Bar' })
	.then(function(result) {
		console.log('[MANAGER] Success kindaUnique C result:%s', JSON.stringify(result));
	}, function(err) {
		console.error('[MANAGER] Failed kindaUnique C result:%s', err.stack);
	});
