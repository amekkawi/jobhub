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
    * [.start()](JobWorkerIPC.md#JobWorker+start) ⇒ <code>Promise</code>

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
<a name="JobWorker+start"></a>

### jobWorkerIPC.start() ⇒ <code>Promise</code>
Starts the job, loads job config, validates params and executes [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: instance method of <code>[JobWorkerIPC](JobWorkerIPC.md#JobWorkerIPC)</code>  
