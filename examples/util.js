/* eslint-disable no-console */

exports.logManagerEvents = function(emitter) {
	emitter.on('jobCreated', function(trackedJob) {
		console.log(
			'[MANAGER] event:jobCreated job:%s id:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId)
		);
	});

	emitter.on('jobStarted', function(trackedJob) {
		console.log(
			'[MANAGER] event:jobStarted job:%s id:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId)
		);
	});

	emitter.on('jobForked', function(trackedJob) {
		console.log(
			'[MANAGER] event:jobForked job:%s id:%s pid:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			trackedJob.workerMediator.processId
		);
	});

	emitter.on('jobProgress', function(trackedJob, progress) {
		console.log(
			'[MANAGER] event:jobForked job:%s id:%s progress:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(progress)
		);
	});

	emitter.on('jobSuccess', function(trackedJob, result) {
		console.log(
			'[MANAGER] event:jobSuccess job:%s id:%s result:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(result)
		);
	});

	emitter.on('jobFailure', function(trackedJob, error) {
		console.error(
			'[MANAGER] event:jobFailure job:%s id:%s error:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(error)
		);
	});
};
