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

hub.queueJob('add', {
	base: 5,
	add: 10
})
	.then(function(result) {
		console.log('[MANAGER] Success add 5 + 10 = %s', result);
	}, function(err) {
		console.error('[MANAGER] Failed add: %s', err.stack);
	});

hub.queueJob('multiply', {
	base: 3,
	factor: 6
})
	.then(function(result) {
		console.log('[MANAGER] Success multiply 3 * 6 = %s', result);
	}, function(err) {
		console.error('[MANAGER] Failed multiply: %s', err.stack);
	});
