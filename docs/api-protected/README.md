# jobhub Extended API

## Typedef

<dl>
<dt><a href="HubManagerOptions.md#HubManagerOptions">HubManagerOptions</a> : <code>object</code></dt>
<dd><p>Configuration options for the <a href="HubManager.md#HubManager">HubManager</a>.</p>
</dd>
<dt><a href="JobConfig.md#JobConfig">JobConfig</a> : <code>object</code></dt>
<dd><p>Configuration for a job.</p>
<p>A job can be defined in two ways:</p>
<ol>
<li>Just a function, which is the code that will run in the child process.</li>
<li>An object that has at a minimum of a <a href="JobConfig.md#JobConfig+run">JobConfig#run</a> function, which is the code that will run in the child process.</li>
</ol>
</dd>
<dt><a href="JobRunArg.md#JobRunArg">JobRunArg</a> : <code>object</code></dt>
<dd><p>Passed to <a href="JobConfig.md#JobConfig+run">JobConfig#run</a> and <a href="JobConfig.md#JobConfig+quickRun">JobConfig#quickRun</a>
to provide information about the job and facilitate communicate progress/success/failure.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="HubManager.md#HubManager">HubManager</a></dt>
<dd><p>Manages the lifecycle of jobs.</p>
</dd>
<dt><a href="JobConfigStore.md#JobConfigStore">JobConfigStore</a></dt>
<dd><p>Manages registered job config.</p>
</dd>
<dt><a href="JobWorker.md#JobWorker">JobWorker</a></dt>
<dd><p>Responsible for running the job in the forked worker process.</p>
</dd>
<dt><a href="JobWorkerIPC.md#JobWorkerIPC">JobWorkerIPC</a> ⇐ <code><a href="JobWorker.md#JobWorker">JobWorker</a></code></dt>
<dd><p>Responsible for running the job in the forked worker process,
receiving configuration and sending events via an IPC messages.</p>
</dd>
<dt><a href="JobWorkerIPCMediator.md#JobWorkerIPCMediator">JobWorkerIPCMediator</a> ⇐ <code><a href="JobWorkerMediator.md#JobWorkerMediator">JobWorkerMediator</a></code></dt>
<dd><p>Manages a job&#39;s forked process during it&#39;s normal lifecycle.</p>
</dd>
<dt><a href="JobWorkerMediator.md#JobWorkerMediator">JobWorkerMediator</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Responsible for forking the job&#39;s child worker process and mediating communication with it.</p>
</dd>
<dt><a href="MiddlewareStore.md#MiddlewareStore">MiddlewareStore</a></dt>
<dd><p>Plugins to customize functionality of jobhub.</p>
</dd>
<dt><a href="TrackedJob.md#TrackedJob">TrackedJob</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Tracks a job that has not yet completed.</p>
</dd>
</dl>

## Error Classes

<dl>
<dt><a href="InvalidManagerOptionsError.md#InvalidManagerOptionsError">InvalidManagerOptionsError</a> ⇐ <code>Error</code></dt>
<dd><p>An InvalidManagerOptionsError object indicates an error
with the options provided to <a href="HubManager.md#HubManager">HubManager</a>.</p>
</dd>
<dt><a href="JobAlreadyExistsError.md#JobAlreadyExistsError">JobAlreadyExistsError</a> ⇐ <code>Error</code></dt>
<dd><p>A JobAlreadyExistsError object indicates that a job config
has already been registered for a specific name.</p>
</dd>
<dt><a href="JobNotFoundError.md#JobNotFoundError">JobNotFoundError</a> ⇐ <code>Error</code></dt>
<dd><p>A JobNotFoundError object indicates that a job config
could not be found for a specific name.</p>
</dd>
<dt><a href="InvalidJobConfigError.md#InvalidJobConfigError">InvalidJobConfigError</a> ⇐ <code>Error</code></dt>
<dd><p>An InvalidJobConfigError object indicates that a <a href="JobConfig.md#JobConfig">JobConfig</a> has
an invalid value for a specific property.</p>
</dd>
<dt><a href="InvalidUniqueKeyError.md#InvalidUniqueKeyError">InvalidUniqueKeyError</a> ⇐ <code>Error</code></dt>
<dd><p>An InvalidUniqueKeyError object indicates that a <a href="JobConfig.md#JobConfig+uniqueKey">JobConfig#uniqueKey</a> returned an invalid value.</p>
</dd>
<dt><a href="JobForkError.md#JobForkError">JobForkError</a> ⇐ <code>Error</code></dt>
<dd><p>A JobForkError object indicates that a forked job encountered an error.</p>
</dd>
<dt><a href="InvalidJobParamError.md#InvalidJobParamError">InvalidJobParamError</a> ⇐ <code>Error</code></dt>
<dd><p>A InvalidJobParamError object indicates that params
did not validate for a specific <a href="JobConfig.md#JobConfig">JobConfig</a>.</p>
</dd>
<dt><a href="UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError">UnsupportedMiddlewareTypeError</a> ⇐ <code>Error</code></dt>
<dd><p>A UnsupportedMiddlewareTypeError object indicates that middleware
was attempted to be used that is not supported.</p>
</dd>
<dt><a href="JobWorkerHandlerError.md#JobWorkerHandlerError">JobWorkerHandlerError</a> ⇐ <code>Error</code></dt>
<dd><p>A JobWorkerHandlerError indicates that an error was caught
while handling the successful or failed result of a job.</p>
</dd>
</dl>

## Middleware

<dl>
<dt><a href="middleware.md#loadJobs">loadJobs(jobs, next)</a></dt>
<dd><p>Intercepts loading and registering of jobs from
<a href="HubManagerOptions.md#HubManagerOptions+jobsModulePath">HubManagerOptions#jobsModulePath</a> by <a href="HubManager.md#HubManager+start">HubManager#start</a>.</p>
</dd>
<dt><a href="middleware.md#createJob">createJob(jobId, jobConfig, params, next)</a></dt>
<dd><p>Intercepts creating a <a href="TrackedJob.md#TrackedJob">TrackedJob</a> instance.</p>
</dd>
<dt><a href="middleware.md#forkJobProcess">forkJobProcess(forkModulePath, forkArgs, forkOpts, next)</a> ⇒ <code>ChildProcess</code></dt>
<dd><p>Intercepts forking the local child process using <code>require(&quot;child_process&quot;).fork</code>.</p>
</dd>
<dt><a href="middleware.md#buildForkArgs">buildForkArgs(trackedJob, next)</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>Intercepts creation of args provided to <a href="middleware.md#forkJobProcess">forkJobProcess</a>.</p>
</dd>
<dt><a href="middleware.md#buildForkOpts">buildForkOpts(trackedJob, next)</a> ⇒ <code>object</code></dt>
<dd><p>Intercepts creation of opts provided to <a href="middleware.md#forkJobProcess">forkJobProcess</a>.</p>
</dd>
<dt><a href="middleware.md#createWorkerMediator">createWorkerMediator(trackedJob, next)</a> ⇒ <code><a href="JobWorkerMediator.md#JobWorkerMediator">JobWorkerMediator</a></code></dt>
<dd><p>Intercepts creation of the <a href="JobWorkerMediator.md#JobWorkerMediator">JobWorkerMediator</a> set to <a href="TrackedJob.md#TrackedJob+workerMediator">TrackedJob#workerMediator</a>.</p>
</dd>
</dl>

## Modules

<dl>
<dt><a href="module_jobhub_lib_util.md#module_jobhub/lib/util">jobhub/lib/util</a></dt>
<dd><p>Helper utilities used by jobhub.</p>
</dd>
<dt><a href="module_jobhub_lib_worker.md#module_jobhub/lib/worker">jobhub/lib/worker</a></dt>
<dd><p>Built-in node script for running job worker child processes.</p>
</dd>
</dl>

