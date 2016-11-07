/* eslint-disable no-console */

exports.logManagerEvents = function(emitter) {
	emitter.on('JOB_CREATED', function(trackedJob) {
		console.log(
			'[MANAGER] event:JOB_CREATED job:%s id:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId)
		);
	});

	emitter.on('JOB_STARTED', function(trackedJob) {
		console.log(
			'[MANAGER] event:JOB_STARTED job:%s id:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId)
		);
	});

	emitter.on('JOB_FORKED', function(trackedJob) {
		console.log(
			'[MANAGER] event:JOB_FORKED job:%s id:%s pid:%s',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			trackedJob.workerMediator.processId
		);
	});

	emitter.on('JOB_PROGRESS', function(trackedJob, progress) {
		console.log(
			'[MANAGER] event:JOB_FORKED job:%s id:%s progress:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(progress)
		);
	});

	emitter.on('JOB_SUCCESS', function(trackedJob, result) {
		console.log(
			'[MANAGER] event:JOB_SUCCESS job:%s id:%s result:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(result)
		);
	});

	emitter.on('JOB_FAILURE', function(trackedJob, error) {
		console.error(
			'[MANAGER] event:JOB_FAILURE job:%s id:%s error:(%s)',
			JSON.stringify(trackedJob.jobConfig.jobName),
			JSON.stringify(trackedJob.jobId),
			JSON.stringify(error)
		);
	});
};
