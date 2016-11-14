<a name="JobWorkerIPC"></a>

## JobWorkerIPC ⇐ <code>[JobWorker](JobWorker.md#JobWorker)</code>
Responsible for running the job in the forked worker process,
receiving configuration and sending events via an IPC messages.

**Kind**: global class  
**Extends:** <code>[JobWorker](JobWorker.md#JobWorker)</code>  

* [JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC) ⇐ <code>[JobWorker](JobWorker.md#JobWorker)</code>
    * [.jobId](JobWorkerIPC.md#JobWorker+jobId) : <code>string</code>
    * [.jobName](JobWorkerIPC.md#JobWorker+jobName) : <code>string</code>
    * [.params](JobWorkerIPC.md#JobWorker+params) : <code>\*</code>
    * [.options](JobWorkerIPC.md#JobWorker+options) : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.running](JobWorkerIPC.md#JobWorker+running) : <code>boolean</code>
    * [.promise](JobWorkerIPC.md#JobWorker+promise) : <code>null</code> &#124; <code>Promise</code>
    * [.middleware](JobWorkerIPC.md#JobWorker+middleware) : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.jobs](JobWorkerIPC.md#JobWorker+jobs) : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.requestIPCPayload()](JobWorkerIPC.md#JobWorkerIPC+requestIPCPayload) ⇒ <code>Promise</code>
    * [.attachIPCChecks()](JobWorkerIPC.md#JobWorkerIPC+attachIPCChecks)
    * [.detachIPCChecks()](JobWorkerIPC.md#JobWorkerIPC+detachIPCChecks)
    * [.watchUncaughtException()](JobWorkerIPC.md#JobWorkerIPC+watchUncaughtException)
    * [.handleSuccess(result)](JobWorkerIPC.md#JobWorkerIPC+handleSuccess) ⇒ <code>Promise</code>
    * [.handleError(err)](JobWorkerIPC.md#JobWorkerIPC+handleError) ⇒ <code>Promise</code>
    * [.handleProgress(progress)](JobWorkerIPC.md#JobWorkerIPC+handleProgress) ⇒ <code>Promise</code>
    * [.start()](JobWorkerIPC.md#JobWorker+start) ⇒ <code>Promise</code>
    * [.getSupportedSyncMiddleware()](JobWorkerIPC.md#JobWorker+getSupportedSyncMiddleware) ⇒ <code>Array.&lt;string&gt;</code>
    * [.init()](JobWorkerIPC.md#JobWorker+init) ⇒ <code>Promise</code>
    * [.loadJob()](JobWorkerIPC.md#JobWorker+loadJob) ⇒ <code>Promise</code>
    * [.buildJobArg(resolve, reject)](JobWorkerIPC.md#JobWorker+buildJobArg) ⇒ <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>

<a name="JobWorker+jobId"></a>

### jobWorkerIPC.jobId : <code>string</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorker+jobName"></a>

### jobWorkerIPC.jobName : <code>string</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorker+params"></a>

### jobWorkerIPC.params : <code>\*</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorker+options"></a>

### jobWorkerIPC.options : <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Overrides:** <code>[options](JobWorker.md#JobWorker+options)</code>  
<a name="JobWorker+running"></a>

### jobWorkerIPC.running : <code>boolean</code>
Set to `true` once [JobWorker#start](JobWorker.md#JobWorker+start) is called and `false` once it succeeds or fails.

**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Default**: <code>false</code>  
<a name="JobWorker+promise"></a>

### jobWorkerIPC.promise : <code>null</code> &#124; <code>Promise</code>
Set to a Promise the first time [JobWorker#start](JobWorker.md#JobWorker+start) is called.

**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Default**: <code>null</code>  
<a name="JobWorker+middleware"></a>

### jobWorkerIPC.middleware : <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorker+jobs"></a>

### jobWorkerIPC.jobs : <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
**Kind**: instance property of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorkerIPC+requestIPCPayload"></a>

### jobWorkerIPC.requestIPCPayload() ⇒ <code>Promise</code>
Request the job payload via IPC, deferring the start of the job until after it is received.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorkerIPC+attachIPCChecks"></a>

### jobWorkerIPC.attachIPCChecks()
Check that the IPC connection is valid and listen for a disconnect.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorkerIPC+detachIPCChecks"></a>

### jobWorkerIPC.detachIPCChecks()
Remove IPC checks (i.e. listening for 'disconnect').

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorkerIPC+watchUncaughtException"></a>

### jobWorkerIPC.watchUncaughtException()
Catch uncaught exceptions and pass them to [JobWorkerIPC#handleError](JobWorkerIPC.md#JobWorkerIPC+handleError).

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorkerIPC+handleSuccess"></a>

### jobWorkerIPC.handleSuccess(result) ⇒ <code>Promise</code>
Called on successful execution of the job, sending an IPC message if still connected.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Overrides:** <code>[handleSuccess](JobWorker.md#JobWorker+handleSuccess)</code>  
**Returns**: <code>Promise</code> - Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.  
**Access:** protected  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorkerIPC+handleError"></a>

### jobWorkerIPC.handleError(err) ⇒ <code>Promise</code>
Called when the job fails due to an error, sending an IPC message if still connected.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Overrides:** <code>[handleError](JobWorker.md#JobWorker+handleError)</code>  
**Returns**: <code>Promise</code> - Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.  
**Access:** protected  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="JobWorkerIPC+handleProgress"></a>

### jobWorkerIPC.handleProgress(progress) ⇒ <code>Promise</code>
Called when the job sends progress, sending an IPC message if still connected.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Overrides:** <code>[handleProgress](JobWorker.md#JobWorker+handleProgress)</code>  
**Returns**: <code>Promise</code> - Resolves once the IPC message is sent, and rejects if there was an error sending the IPC message.  
**Access:** protected  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorker+start"></a>

### jobWorkerIPC.start() ⇒ <code>Promise</code>
Starts the job, loads job config, validates params and executes [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
<a name="JobWorker+getSupportedSyncMiddleware"></a>

### jobWorkerIPC.getSupportedSyncMiddleware() ⇒ <code>Array.&lt;string&gt;</code>
Get the list of supported sync middleware types.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorker+init"></a>

### jobWorkerIPC.init() ⇒ <code>Promise</code>
Initialize worker options and load jobs.

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Overrides:** <code>[init](JobWorker.md#JobWorker+init)</code>  
**Access:** protected  
<a name="JobWorker+loadJob"></a>

### jobWorkerIPC.loadJob() ⇒ <code>Promise</code>
Load the jobs from the module specified by [HubManagerOptions#jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath).

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  
<a name="JobWorker+buildJobArg"></a>

### jobWorkerIPC.buildJobArg(resolve, reject) ⇒ <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>
Build the "job" argument for [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| resolve | <code>function</code> | 
| reject | <code>function</code> | 
