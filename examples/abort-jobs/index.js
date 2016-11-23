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

var trackedJobA = hub.queueJob('stallingValidation');
trackedJobA.catch(function(err) {
	console.log('[MANAGER] stallingValidation failed (' + err.name + '): ' + err.message);
});
setTimeout(function() {
	trackedJobA.abort('Took too long!');
}, 1000);

var trackedJobB = hub.queueJob('stallingQuickRun');
trackedJobB.catch(function(err) {
	console.log('[MANAGER] stallingQuickRun failed (' + err.name + '): ' + err.message);
});
setTimeout(function() {
	trackedJobB.abort('Took too long!');
}, 1000);

var trackedJobC = hub.queueJob('stallingRun');
trackedJobC.catch(function(err) {
	console.log('[MANAGER] stallingRun failed (' + err.name + '): ' + err.message);
});
trackedJobC.on('jobForked', function() {
	setTimeout(function() {
		trackedJobC.abort('Took too long!');
	}, 1000);
});
