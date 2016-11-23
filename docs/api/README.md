# jobhub API

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
<dt><a href="JobWorker.md#JobWorker">JobWorker</a> ⇐ <code>EventEmitter</code></dt>
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
<dt><a href="JobAbortedError.md#JobAbortedError">JobAbortedError</a> ⇐ <code>Error</code></dt>
<dd><p>A JobAbortedError object indicates that a forked job has been aborted by calling <a href="TrackedJob.md#TrackedJob+abort">TrackedJob#abort</a>.</p>
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

