# [jobhub API](README.md): Typedef:

<a name="JobConfig"></a>

## JobConfig : <code>object</code>
Configuration for a job.

A job can be defined in two ways:

1. Just a function, which is the code that will run in the child process.
2. An object that has at a minimum of a [JobConfig#run](JobConfig.md#JobConfig+run) function, which is the code that will run in the child process.

**Kind**: global typedef  

* [JobConfig](JobConfig.md#JobConfig) : <code>object</code>
    * [.unique](JobConfig.md#JobConfig+unique) : <code>boolean</code>
    * [.meta](JobConfig.md#JobConfig+meta) : <code>object</code>
    * [.jobName](JobConfig.md#JobConfig+jobName) : <code>string</code>
    * [.run(job)](JobConfig.md#JobConfig+run)
    * [.uniqueKey(params)](JobConfig.md#JobConfig+uniqueKey) ⇒ <code>void</code> &#124; <code>null</code> &#124; <code>String</code>
    * [.validate(params, InvalidJobParamError)](JobConfig.md#JobConfig+validate) ⇒ <code>void</code> &#124; <code>Promise</code>
    * [.onCreate(trackedJob)](JobConfig.md#JobConfig+onCreate)
    * [.quickRun(job, next)](JobConfig.md#JobConfig+quickRun)

<a name="JobConfig+unique"></a>

### jobConfig.unique : <code>boolean</code>
Optional. Set to `true` to only allow one instance of the job to run at a time.
Attempts to queue the job while one is still running will return the [TrackedJob](TrackedJob.md#TrackedJob) instance of the already running job.
This option is ignored if [JobConfig#uniqueKey](JobConfig.md#JobConfig+uniqueKey) is set.

**Kind**: instance property of <code>[JobConfig](JobConfig.md#JobConfig)</code>  
**Default**: <code>false</code>  
<a name="JobConfig+meta"></a>

### jobConfig.meta : <code>object</code>
User-defined data that can be stored with the JobConfig.

**Kind**: instance property of <code>[JobConfig](JobConfig.md#JobConfig)</code>  
**Default**: <code>{}</code>  
<a name="JobConfig+jobName"></a>

### jobConfig.jobName : <code>string</code>
Set by jobhub after the job config is registered with a [JobConfigStore](JobConfigStore.md#JobConfigStore).

**Kind**: instance property of <code>[JobConfig](JobConfig.md#JobConfig)</code>  
<a name="JobConfig+run"></a>

### jobConfig.run(job)
Required. This function will be executed in the child process to run the job.

**Kind**: instance method of <code>[JobConfig](JobConfig.md#JobConfig)</code>  

| Param | Type |
| --- | --- |
| job | <code>[JobRunArg](JobRunArg.md#JobRunArg)</code> | 

<a name="JobConfig+uniqueKey"></a>

### jobConfig.uniqueKey(params) ⇒ <code>void</code> &#124; <code>null</code> &#124; <code>String</code>
Optional. Provides a unique key used to only allow one instance of the job to run at a time for that key.

The unique key returned must be a string, but the function can also return null/undefined to allow that job to run
without being unique. This function runs in the same process the [HubManager](HubManager.md#HubManager) is started in.

**Kind**: instance method of <code>[JobConfig](JobConfig.md#JobConfig)</code>  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>\*</code> | Value provided to [HubManager#queueJob](HubManager.md#HubManager+queueJob). |

<a name="JobConfig+validate"></a>

### jobConfig.validate(params, InvalidJobParamError) ⇒ <code>void</code> &#124; <code>Promise</code>
Optional. Validates the params value provided to [HubManager#queueJob](HubManager.md#HubManager+queueJob).
The function will receive two arguments, the params value provided to [HubManager#queueJob](HubManager.md#HubManager+queueJob) and the
[InvalidJobParamError](InvalidJobParamError.md#InvalidJobParamError) constructor. The function should throw an Error
(preferably [InvalidJobParamError](InvalidJobParamError.md#InvalidJobParamError)) if the params are invalid. The function can return a
Promise to validate the params asynchronously.

**Kind**: instance method of <code>[JobConfig](JobConfig.md#JobConfig)</code>  
**Throws**:

- <code>Error</code><code>[InvalidJobParamError](InvalidJobParamError.md#InvalidJobParamError)</code> 


| Param | Type | Description |
| --- | --- | --- |
| params | <code>\*</code> |  |
| InvalidJobParamError | <code>[InvalidJobParamError](InvalidJobParamError.md#InvalidJobParamError)</code> | Error constructor that should be used to throw validation errors. |

<a name="JobConfig+onCreate"></a>

### jobConfig.onCreate(trackedJob)
Called when a job for this config is created, similar to the [HubManager#event:jobCreated](HubManager.md#HubManager+event_jobCreated) event.

**Kind**: instance method of <code>[JobConfig](JobConfig.md#JobConfig)</code>  
**See**: [HubManager#queueJob](HubManager.md#HubManager+queueJob)  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="JobConfig+quickRun"></a>

### jobConfig.quickRun(job, next)
Optional. This function will be executed in the [HubManager](HubManager.md#HubManager) process to optionally allow a job
to be quickly resolved/rejected without starting a child process.

**Kind**: instance method of <code>[JobConfig](JobConfig.md#JobConfig)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[JobRunArg](JobRunArg.md#JobRunArg)</code> |  |
| next | <code>function</code> | Call to skip "quickRun", continuing to "run" the worker. |

