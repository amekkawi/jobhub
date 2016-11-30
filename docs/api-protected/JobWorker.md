# [jobhub Extended API](README.md): Class:

<a name="JobWorker"></a>

## JobWorker ⇐ <code>EventEmitter</code>
Responsible for running the job in the forked worker process.

**Kind**: global class  
**Extends:** <code>EventEmitter</code>  
**Emits**: <code>[jobAbort](JobWorker.md#JobWorker+event_jobAbort)</code>  

* [JobWorker](JobWorker.md#JobWorker) ⇐ <code>EventEmitter</code>
    * [new JobWorker(jobId, jobName, params, options)](JobWorker.md#JobWorker)
    * [.jobId](JobWorker.md#JobWorker+jobId) : <code>string</code>
    * [.jobName](JobWorker.md#JobWorker+jobName) : <code>string</code>
    * [.params](JobWorker.md#JobWorker+params) : <code>\*</code>
    * [.options](JobWorker.md#JobWorker+options) : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.running](JobWorker.md#JobWorker+running) : <code>boolean</code>
    * [.promise](JobWorker.md#JobWorker+promise) : <code>null</code> &#124; <code>Promise</code>
    * [.middleware](JobWorker.md#JobWorker+middleware) : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.jobs](JobWorker.md#JobWorker+jobs) : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.start()](JobWorker.md#JobWorker+start) ⇒ <code>Promise</code>
    * [.getSupportedSyncMiddleware()](JobWorker.md#JobWorker+getSupportedSyncMiddleware) ⇒ <code>Array.&lt;string&gt;</code>
    * [.init()](JobWorker.md#JobWorker+init) ⇒ <code>Promise</code>
    * [.loadJob()](JobWorker.md#JobWorker+loadJob) ⇒ <code>Promise</code>
    * [.buildJobArg(resolve, reject)](JobWorker.md#JobWorker+buildJobArg) ⇒ <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>
    * [.handleSuccess(result)](JobWorker.md#JobWorker+handleSuccess) ⇒ <code>Promise</code>
    * [.handleError(err)](JobWorker.md#JobWorker+handleError) ⇒ <code>Promise</code>
    * [.handleProgress(progress)](JobWorker.md#JobWorker+handleProgress) ⇒ <code>Promise</code>
    * [.handleAbort()](JobWorker.md#JobWorker+handleAbort)
    * ["jobAbort"](JobWorker.md#JobWorker+event_jobAbort)

<a name="new_JobWorker_new"></a>

### new JobWorker(jobId, jobName, params, options)

| Param | Type |
| --- | --- |
| jobId | <code>string</code> | 
| jobName | <code>string</code> | 
| params | <code>\*</code> | 
| options | <code>object</code> &#124; <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code> | 

<a name="JobWorker+jobId"></a>

### jobWorker.jobId : <code>string</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+jobName"></a>

### jobWorker.jobName : <code>string</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+params"></a>

### jobWorker.params : <code>\*</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+options"></a>

### jobWorker.options : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+running"></a>

### jobWorker.running : <code>boolean</code>
Set to `true` once [JobWorker#start](JobWorker.md#JobWorker+start) is called and `false` once it succeeds or fails.

**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Default**: <code>false</code>  
<a name="JobWorker+promise"></a>

### jobWorker.promise : <code>null</code> &#124; <code>Promise</code>
Set to a Promise the first time [JobWorker#start](JobWorker.md#JobWorker+start) is called.

**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Default**: <code>null</code>  
<a name="JobWorker+middleware"></a>

### jobWorker.middleware : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+jobs"></a>

### jobWorker.jobs : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
**Kind**: instance property of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+start"></a>

### jobWorker.start() ⇒ <code>Promise</code>
Starts the job, loads job config, validates params and executes [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
<a name="JobWorker+getSupportedSyncMiddleware"></a>

### jobWorker.getSupportedSyncMiddleware() ⇒ <code>Array.&lt;string&gt;</code>
Get the list of supported sync middleware types.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  
<a name="JobWorker+init"></a>

### jobWorker.init() ⇒ <code>Promise</code>
Initialize worker options and load jobs.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  
<a name="JobWorker+loadJob"></a>

### jobWorker.loadJob() ⇒ <code>Promise</code>
Load the jobs from the module specified by [HubManagerOptions#jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath).

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  
<a name="JobWorker+buildJobArg"></a>

### jobWorker.buildJobArg(resolve, reject) ⇒ <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>
Build the "job" argument for [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| resolve | <code>function</code> | 
| reject | <code>function</code> | 

<a name="JobWorker+handleSuccess"></a>

### jobWorker.handleSuccess(result) ⇒ <code>Promise</code>
Called on successful execution of the job.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Returns**: <code>Promise</code> - Resolves once the success is handled, and rejects if there was an error handling the success.  
**Access:** protected  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorker+handleError"></a>

### jobWorker.handleError(err) ⇒ <code>Promise</code>
Called when the job fails due to an error.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Returns**: <code>Promise</code> - Resolves once the error is handled, and rejects if there was an error handling the original error.  
**Access:** protected  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="JobWorker+handleProgress"></a>

### jobWorker.handleProgress(progress) ⇒ <code>Promise</code>
Called when the job sends progress.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Returns**: <code>Promise</code> - Resolves once the progress is sent, and rejects if there was an error sending the progress.  
**Access:** protected  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorker+handleAbort"></a>

### jobWorker.handleAbort()
Called when the JobWorker is notified of an abort.

Emits a [JobWorker#event:jobAbort](JobWorker.md#JobWorker+event_jobAbort) only if [JobWorker#running](JobWorker.md#JobWorker+running) is true.

**Kind**: instance method of <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  
<a name="JobWorker+event_jobAbort"></a>

### "jobAbort"
Fires when the job is told to abort.

**Kind**: event emitted by <code>[JobWorker](JobWorker.md#JobWorker)</code>  
