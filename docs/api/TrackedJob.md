<a name="TrackedJob"></a>

## TrackedJob ⇐ <code>EventEmitter</code>
Tracks a job that has not yet completed.

**Kind**: global class  
**Extends:** <code>EventEmitter</code>  
**Emits**: <code>[jobStarted](TrackedJob.md#TrackedJob+event_jobStarted)</code>, <code>[jobForked](TrackedJob.md#TrackedJob+event_jobForked)</code>, <code>[jobProgress](TrackedJob.md#TrackedJob+event_jobProgress)</code>, <code>[jobSuccess](TrackedJob.md#TrackedJob+event_jobSuccess)</code>, <code>[jobFailure](TrackedJob.md#TrackedJob+event_jobFailure)</code>  

* [TrackedJob](TrackedJob.md#TrackedJob) ⇐ <code>EventEmitter</code>
    * [new TrackedJob(manager, jobId, jobConfig, [params])](TrackedJob.md#TrackedJob)
    * [.created](TrackedJob.md#TrackedJob+created) : <code>Date</code>
    * [.stage](TrackedJob.md#TrackedJob+stage) : <code>string</code> &#124; <code>null</code>
    * [.manager](TrackedJob.md#TrackedJob+manager) : <code>[HubManager](HubManager.md#HubManager)</code>
    * [.jobId](TrackedJob.md#TrackedJob+jobId) : <code>string</code>
    * [.jobConfig](TrackedJob.md#TrackedJob+jobConfig) : <code>[JobConfig](JobConfig.md#JobConfig)</code>
    * [.params](TrackedJob.md#TrackedJob+params) : <code>\*</code>
    * [.isRunning](TrackedJob.md#TrackedJob+isRunning) : <code>boolean</code>
    * [.promise](TrackedJob.md#TrackedJob+promise) : <code>null</code> &#124; <code>Promise</code>
    * [.workerMediator](TrackedJob.md#TrackedJob+workerMediator) : <code>null</code> &#124; <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * [.progress](TrackedJob.md#TrackedJob+progress) : <code>\*</code>
    * [.then()](TrackedJob.md#TrackedJob+then) ⇒ <code>Promise</code>
    * [.catch()](TrackedJob.md#TrackedJob+catch) ⇒ <code>Promise</code>
    * [.run()](TrackedJob.md#TrackedJob+run) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * [.reEmitTo(eventEmitter)](TrackedJob.md#TrackedJob+reEmitTo) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * ["jobStarted"](TrackedJob.md#TrackedJob+event_jobStarted)
    * ["jobForked"](TrackedJob.md#TrackedJob+event_jobForked)
    * ["jobProgress" (progress)](TrackedJob.md#TrackedJob+event_jobProgress)
    * ["jobSuccess" (result)](TrackedJob.md#TrackedJob+event_jobSuccess)
    * ["jobFailure" (error)](TrackedJob.md#TrackedJob+event_jobFailure)

<a name="new_TrackedJob_new"></a>

### new TrackedJob(manager, jobId, jobConfig, [params])

| Param | Type | Description |
| --- | --- | --- |
| manager | <code>[HubManager](HubManager.md#HubManager)</code> |  |
| jobId | <code>string</code> | Unique ID for the tracked job. |
| jobConfig | <code>[JobConfig](JobConfig.md#JobConfig)</code> |  |
| [params] | <code>\*</code> |  |

<a name="TrackedJob+created"></a>

### trackedJob.created : <code>Date</code>
Date when the TrackedJob was created.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+stage"></a>

### trackedJob.stage : <code>string</code> &#124; <code>null</code>
The name of the stage of the tracked job's lifecycle that is executing, or for a job
that resolved/rejected it is the stage that was run just before resolving or rejecting.

Stage values:

* `null` - Initial value until [TrackedJob#run](TrackedJob.md#TrackedJob+run) is called.
* `"validateParams"` - Set just before validating the params.
* `"quickRun"` - Set just before attempting to quick run the job (even if [JobConfig#quickRun](JobConfig.md#JobConfig+quickRun) is not defined).
* `"run"` - Set just before starting the child worker.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+manager"></a>

### trackedJob.manager : <code>[HubManager](HubManager.md#HubManager)</code>
The [HubManager](HubManager.md#HubManager) that is tracking this job.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+jobId"></a>

### trackedJob.jobId : <code>string</code>
Unique ID for the tracked job.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+jobConfig"></a>

### trackedJob.jobConfig : <code>[JobConfig](JobConfig.md#JobConfig)</code>
The [JobConfig](JobConfig.md#JobConfig) used to create this job.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+params"></a>

### trackedJob.params : <code>\*</code>
Parameters for this job passed from [HubManager#queueJob](HubManager.md#HubManager+queueJob).

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+isRunning"></a>

### trackedJob.isRunning : <code>boolean</code>
Set to `true` once [JobConfig#run](JobConfig.md#JobConfig+run) is called and false after the job succeeds or fails.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+promise"></a>

### trackedJob.promise : <code>null</code> &#124; <code>Promise</code>
Set to a Promise after run() is called, and is fulfilled once the job succeeds or fails.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+workerMediator"></a>

### trackedJob.workerMediator : <code>null</code> &#124; <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Set to the worker mediator instance if a worker is started.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+progress"></a>

### trackedJob.progress : <code>\*</code>
The last emitted progress value.

**Kind**: instance property of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+then"></a>

### trackedJob.then() ⇒ <code>Promise</code>
Convinence method for `TrackedJob.promise.then`.

Only usable after [TrackedJob#run](TrackedJob.md#TrackedJob+run) is called.

**Kind**: instance method of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+catch"></a>

### trackedJob.catch() ⇒ <code>Promise</code>
Convinence method for `TrackedJob.promise.catch`.

Only usable after [TrackedJob#run](TrackedJob.md#TrackedJob+run) is called.

**Kind**: instance method of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+run"></a>

### trackedJob.run() ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
Start the job, if it has not already started.

**Kind**: instance method of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+reEmitTo"></a>

### trackedJob.reEmitTo(eventEmitter) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
Re-emit TrackedJob events to another EventEmitter,
preceeding arguments with an argument for this TrackedJob instance.

**Kind**: instance method of <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  

| Param | Type |
| --- | --- |
| eventEmitter | <code>EventEmitter</code> | 

<a name="TrackedJob+event_jobStarted"></a>

### "jobStarted"
Fires when the tracked job is started using [TrackedJob#run](TrackedJob.md#TrackedJob+run).

**Kind**: event emitted by <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+event_jobForked"></a>

### "jobForked"
Fires when the tracked job forks its child worker process.

**Kind**: event emitted by <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
<a name="TrackedJob+event_jobProgress"></a>

### "jobProgress" (progress)
Fires when the tracked job sends its 'progress'.

**Kind**: event emitted by <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="TrackedJob+event_jobSuccess"></a>

### "jobSuccess" (result)
Fires when the tracked job reports success.

**Kind**: event emitted by <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="TrackedJob+event_jobFailure"></a>

### "jobFailure" (error)
Fires when the tracked job reports failure.

**Kind**: event emitted by <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

