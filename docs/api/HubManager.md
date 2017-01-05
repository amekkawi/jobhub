# [jobhub API](README.md): Class:

<a name="HubManager"></a>

## HubManager
Manages the lifecycle of jobs.

**Kind**: global class  
**Emits**: <code>[managerStarted](HubManager.md#HubManager+event_managerStarted)</code>, <code>[jobCreated](HubManager.md#HubManager+event_jobCreated)</code>, <code>[jobStarted](HubManager.md#HubManager+event_jobStarted)</code>, <code>[jobForked](HubManager.md#HubManager+event_jobForked)</code>, <code>[jobProgress](HubManager.md#HubManager+event_jobProgress)</code>, <code>[jobSuccess](HubManager.md#HubManager+event_jobSuccess)</code>, <code>[jobFailure](HubManager.md#HubManager+event_jobFailure)</code>, <code>[jobAbort](HubManager.md#HubManager+event_jobAbort)</code>, <code>[jobTerminate](HubManager.md#HubManager+event_jobTerminate)</code>  

* [HubManager](HubManager.md#HubManager)
    * [new HubManager(options)](HubManager.md#HubManager)
    * [.options](HubManager.md#HubManager+options) : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.middleware](HubManager.md#HubManager+middleware) : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.jobs](HubManager.md#HubManager+jobs) : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.jobExecutor](HubManager.md#HubManager+jobExecutor) : <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
    * [.start()](HubManager.md#HubManager+start) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
    * [.addSyncMiddleware(type, middleware, [priority])](HubManager.md#HubManager+addSyncMiddleware) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
    * [.getUniqueKey(job, [params])](HubManager.md#HubManager+getUniqueKey) ⇒ <code>string</code> &#124; <code>null</code>
    * [.validateJobParams(job, params)](HubManager.md#HubManager+validateJobParams) ⇒ <code>Promise</code>
    * [.getTrackedJob(jobId)](HubManager.md#HubManager+getTrackedJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
    * [.getTrackedJobs()](HubManager.md#HubManager+getTrackedJobs) ⇒ <code>[Array.&lt;TrackedJob&gt;](TrackedJob.md#TrackedJob)</code>
    * [.findUniqueTrackedJob(jobName, [uniqueKey])](HubManager.md#HubManager+findUniqueTrackedJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
    * [.queueJob(job, [params])](HubManager.md#HubManager+queueJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * ["managerStarted"](HubManager.md#HubManager+event_managerStarted)
    * ["jobCreated" (trackedJob)](HubManager.md#HubManager+event_jobCreated)
    * ["jobTerminate" (trackedJob, isForceKill)](HubManager.md#HubManager+event_jobTerminate)
    * ["jobStarted" (trackedJob)](HubManager.md#HubManager+event_jobStarted)
    * ["jobForked" (trackedJob)](HubManager.md#HubManager+event_jobForked)
    * ["jobProgress" (trackedJob, progress)](HubManager.md#HubManager+event_jobProgress)
    * ["jobSuccess" (trackedJob, result)](HubManager.md#HubManager+event_jobSuccess)
    * ["jobFailure" (trackedJob, error)](HubManager.md#HubManager+event_jobFailure)
    * ["jobAbort" (trackedJob)](HubManager.md#HubManager+event_jobAbort)

<a name="new_HubManager_new"></a>

### new HubManager(options)

| Param | Type |
| --- | --- |
| options | <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code> | 

<a name="HubManager+options"></a>

### hubManager.options : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
Parsed options provided to HubManager.

**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+middleware"></a>

### hubManager.middleware : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
Middleware store used by the HubManager.

**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+jobs"></a>

### hubManager.jobs : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
Stores [JobConfig](JobConfig.md#JobConfig) registered for the HubManager.

**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+jobExecutor"></a>

### hubManager.jobExecutor : <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
Manages running queued jobs.

**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+start"></a>

### hubManager.start() ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
Start the HubManager instance, loading jobs from the module specified by [HubManagerOptions#jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath).

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[JobAlreadyExistsError](JobAlreadyExistsError.md#JobAlreadyExistsError)</code> 
- <code>[InvalidJobConfigError](InvalidJobConfigError.md#InvalidJobConfigError)</code> 

<a name="HubManager+addSyncMiddleware"></a>

### hubManager.addSyncMiddleware(type, middleware, [priority]) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
Add a sync middleware.

Shortcut for `hubManager.middleware.addSyncMiddleware` that allows chaining.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[UnsupportedMiddlewareTypeError](UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError)</code> 


| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> |  | 
| middleware | <code>function</code> |  | 
| [priority] | <code>number</code> | <code>100</code> | 

<a name="HubManager+getUniqueKey"></a>

### hubManager.getUniqueKey(job, [params]) ⇒ <code>string</code> &#124; <code>null</code>
Get the key to identify unique tracked jobs,
or null if a job does not have uniqueness.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[JobNotFoundError](JobNotFoundError.md#JobNotFoundError)</code> 
- <code>[InvalidUniqueKeyError](InvalidUniqueKeyError.md#InvalidUniqueKeyError)</code> 


| Param | Type |
| --- | --- |
| job | <code>string</code> &#124; <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| [params] | <code>\*</code> | 

<a name="HubManager+validateJobParams"></a>

### hubManager.validateJobParams(job, params) ⇒ <code>Promise</code>
Check if params are valid for a job, if validation if specified in its [JobConfig](JobConfig.md#JobConfig).

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Fulfil**: <code>void</code> - If JobConfig does not validate or params are valid.  
**Reject**: <code>[JobNotFoundError](JobNotFoundError.md#JobNotFoundError)</code> - Indicates the job argument is a string and the job wasn't found.  
**Reject**: <code>[InvalidJobParamError](InvalidJobParamError.md#InvalidJobParamError)</code> - Indicates the job's params are invalid.  

| Param | Type |
| --- | --- |
| job | <code>string</code> &#124; <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| params | <code>\*</code> | 

<a name="HubManager+getTrackedJob"></a>

### hubManager.getTrackedJob(jobId) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
Get a running TrackedJob by jobId.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| jobId | <code>string</code> | 

<a name="HubManager+getTrackedJobs"></a>

### hubManager.getTrackedJobs() ⇒ <code>[Array.&lt;TrackedJob&gt;](TrackedJob.md#TrackedJob)</code>
Get running TrackedJobs.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+findUniqueTrackedJob"></a>

### hubManager.findUniqueTrackedJob(jobName, [uniqueKey]) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
Attempt to find the existing tracked job based on uniqueness.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[InvalidUniqueKeyError](InvalidUniqueKeyError.md#InvalidUniqueKeyError)</code> 


| Param | Type | Description |
| --- | --- | --- |
| jobName | <code>string</code> |  |
| [uniqueKey] | <code>string</code> | Must be specified for jobs that implement [JobConfig#uniqueKey](JobConfig.md#JobConfig+uniqueKey). |

<a name="HubManager+queueJob"></a>

### hubManager.queueJob(job, [params]) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
Queue a job to be run with the specified params.

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[JobNotFoundError](JobNotFoundError.md#JobNotFoundError)</code> 
- <code>[InvalidUniqueKeyError](InvalidUniqueKeyError.md#InvalidUniqueKeyError)</code> 


| Param | Type |
| --- | --- |
| job | <code>string</code> &#124; <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| [params] | <code>\*</code> | 

<a name="HubManager+event_managerStarted"></a>

### "managerStarted"
Fired when [HubManager#start](HubManager.md#HubManager+start) is called, after job definitions have been loaded.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+event_jobCreated"></a>

### "jobCreated" (trackedJob)
Fired when a job is queued *and* created. This is not fired if an existing unique job was found.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="HubManager+event_jobTerminate"></a>

### "jobTerminate" (trackedJob, isForceKill)
Fired when a job that has not gracefully excited is being terminated.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type | Description |
| --- | --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> |  |
| isForceKill | <code>boolean</code> | If the job is being forced to exit (i.e. kill -9) |

<a name="HubManager+event_jobStarted"></a>

### "jobStarted" (trackedJob)
Fires when a job is started using [TrackedJob#run](TrackedJob.md#TrackedJob+run).

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="HubManager+event_jobForked"></a>

### "jobForked" (trackedJob)
Fires when a job forks its child worker process.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="HubManager+event_jobProgress"></a>

### "jobProgress" (trackedJob, progress)
Fires when a job sends its 'progress'.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| progress | <code>\*</code> | 

<a name="HubManager+event_jobSuccess"></a>

### "jobSuccess" (trackedJob, result)
Fires when a job reports success.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| result | <code>\*</code> | 

<a name="HubManager+event_jobFailure"></a>

### "jobFailure" (trackedJob, error)
Fires when a job reports failure.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| error | <code>Error</code> | 

<a name="HubManager+event_jobAbort"></a>

### "jobAbort" (trackedJob)
Fires when a job is attempted to be aborted.

**Kind**: event emitted by <code>[HubManager](HubManager.md#HubManager)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

