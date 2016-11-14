# [jobhub API](README.md): Class:

<a name="JobWorker"></a>

## JobWorker
Responsible for running the job in the forked worker process.

**Kind**: global class  

* [JobWorker](JobWorker.md#JobWorker)
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
