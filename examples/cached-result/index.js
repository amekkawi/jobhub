/* eslint-disable no-console */

var path = require('path');
var jobhub = require('../../lib/index');

var verbose = process.argv.indexOf('-v') >= 0;

var hub = new jobhub.HubManager({
	jobsModulePath: path.resolve(__dirname, 'jobs.js')
}).start();

if (verbose) {
	require('../util').logManagerEvents(hub);
}

hub.queueJob('sortedFirstLast')
	.then(function(result) {
		console.log('[MANAGER] Success sortedFirstLast result:%s', JSON.stringify(result));

		// Run again to check that it's coming from the cache
		hub.queueJob('sortedFirstLast')
			.then(function(result) {
				console.log('[MANAGER] Success cached sortedFirstLast result:%s', JSON.stringify(result));
			}, function(err) {
				console.error('[MANAGER] Failed cached sortedFirstLast: %s', err.stack);
			});
	}, function(err) {
		console.error('[MANAGER] Failed sortedFirstLast: %s', err.stack);
	});
