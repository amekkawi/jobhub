<a name="HubManager"></a>

## HubManager
Manages the lifecyle of jobs.

**Kind**: global class  
**Emits**: <code>[managerStarted](HubManager.md#HubManager+event_managerStarted)</code>, <code>[jobCreated](HubManager.md#HubManager+event_jobCreated)</code>, <code>[jobTerminate](HubManager.md#HubManager+event_jobTerminate)</code>  

* [HubManager](HubManager.md#HubManager)
    * [new HubManager(options)](HubManager.md#HubManager)
    * [.options](HubManager.md#HubManager+options) : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.middleware](HubManager.md#HubManager+middleware) : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.jobs](HubManager.md#HubManager+jobs) : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.start()](HubManager.md#HubManager+start) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
    * [.addSyncMiddlware(type, middleware, [priority])](HubManager.md#HubManager+addSyncMiddlware) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
    * [.getUniqueKey(job, [params])](HubManager.md#HubManager+getUniqueKey) ⇒ <code>string</code> &#124; <code>null</code>
    * [.validateJobParams(job, params)](HubManager.md#HubManager+validateJobParams) ⇒ <code>Promise</code>
    * [.getTrackedJob(jobId)](HubManager.md#HubManager+getTrackedJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
    * [.getTrackedJobs()](HubManager.md#HubManager+getTrackedJobs) ⇒ <code>[Array.&lt;TrackedJob&gt;](TrackedJob.md#TrackedJob)</code>
    * [.findUniqueTrackedJob(jobName, [uniqueKey])](HubManager.md#HubManager+findUniqueTrackedJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> &#124; <code>null</code>
    * [.queueJob(job, [params])](HubManager.md#HubManager+queueJob) ⇒ <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * ["managerStarted"](HubManager.md#HubManager+event_managerStarted)
    * ["jobCreated" (trackedJob)](HubManager.md#HubManager+event_jobCreated)
    * ["jobTerminate" (trackedJob, isForceKill)](HubManager.md#HubManager+event_jobTerminate)

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
**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+jobs"></a>

### hubManager.jobs : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
**Kind**: instance property of <code>[HubManager](HubManager.md#HubManager)</code>  
<a name="HubManager+start"></a>

### hubManager.start() ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
Start the HubManager instance, loading jobs from the module specified by [HubManagerOptions#jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath).

**Kind**: instance method of <code>[HubManager](HubManager.md#HubManager)</code>  
**Throws**:

- <code>[JobAlreadyExistsError](JobAlreadyExistsError.md#JobAlreadyExistsError)</code> 
- <code>[InvalidJobConfigError](InvalidJobConfigError.md#InvalidJobConfigError)</code> 

<a name="HubManager+addSyncMiddlware"></a>

### hubManager.addSyncMiddlware(type, middleware, [priority]) ⇒ <code>[HubManager](HubManager.md#HubManager)</code>
Add a sync middleware.

Shortcut for `hubManager.middleware.addSyncMiddlware` that allows chaining.

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

