exports.UNIQUE_KEY = '__UNIQUE__KEY__';

exports.JOB_STAGE_VALIDATE_PARAMS = 'validateParams';
exports.JOB_STAGE_QUICK_RUN = 'quickRun';
exports.JOB_STAGE_RUN = 'run';

exports.EVENT_JOB_REGISTERED = 'jobRegistered';
exports.EVENT_JOB_UNREGISTERED = 'jobUnregistered';

exports.EVENT_MANAGER_STARTED = 'managerStarted';
exports.EVENT_JOB_CREATED = 'jobCreated';
exports.EVENT_JOB_STARTED = 'jobStarted';
exports.EVENT_JOB_FORKED = 'jobForked';
exports.EVENT_JOB_SUCCESS = 'jobSuccess';
exports.EVENT_JOB_FAILURE = 'jobFailure';
exports.EVENT_JOB_PROGRESS = 'jobProgress';
exports.EVENT_JOB_EXIT = 'jobExit';
exports.EVENT_JOB_TERMINATE = 'jobTerminate';

exports.JOB_MESSAGE_STARTUP = '__JOBHUB_WORKER_STARTUP__';
exports.JOB_MESSAGE_PAYLOAD = '__JOBHUB_WORKER_PAYLOAD__';
exports.JOB_MESSAGE_SUCCESS = '__JOBHUB_WORKER_SUCCESS__';
exports.JOB_MESSAGE_ERROR = '__JOBHUB_WORKER_ERROR__';
exports.JOB_MESSAGE_PROGRESS = '__JOBHUB_WORKER_PROGRESS__';

exports.MIDDLEWARE_LOAD_JOBS = 'loadJobs';
exports.MIDDLEWARE_CREATE_JOB = 'createJob';
exports.MIDDLEWARE_FORK_JOB_PROCESS = 'forkJobProcess';
exports.MIDDLEWARE_BUILD_FORK_ARGS = 'buildForkArgs';
exports.MIDDLEWARE_BUILD_FORK_OPTS = 'buildForkOpts';
exports.MIDDLEWARE_CREATE_WORKER_MEDIATOR = 'createWorkerMediator';

exports.MIDDLEWARE_WORKER_LOAD_JOB = 'workerLoadJob';
exports.MIDDLEWARE_WORKER_BUILD_JOB_ARG = 'workerBuildJobArg';
