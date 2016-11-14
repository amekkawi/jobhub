<a name="JobRunArg"></a>

## JobRunArg : <code>object</code>
Passed to [JobConfig#run](JobConfig.md#JobConfig+run) and [JobConfig#quickRun](JobConfig.md#JobConfig+quickRun)
to provide information about the job and facilitate communicate progress/success/failure.

**Kind**: global typedef  

* [JobRunArg](JobRunArg.md#JobRunArg) : <code>object</code>
    * [.jobId](JobRunArg.md#JobRunArg+jobId) : <code>string</code>
    * [.params](JobRunArg.md#JobRunArg+params) : <code>\*</code>
    * [.resolve(result)](JobRunArg.md#JobRunArg+resolve)
    * [.reject(error)](JobRunArg.md#JobRunArg+reject)
    * [.sendProgress(progress)](JobRunArg.md#JobRunArg+sendProgress) ⇒ <code>Promise</code>

<a name="JobRunArg+jobId"></a>

### jobRunArg.jobId : <code>string</code>
The unique identifier for the job.

**Kind**: instance property of <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>  
<a name="JobRunArg+params"></a>

### jobRunArg.params : <code>\*</code>
The params passed to [HubManager#queueJob](HubManager.md#HubManager+queueJob).

**Kind**: instance property of <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>  
<a name="JobRunArg+resolve"></a>

### jobRunArg.resolve(result)
Call to resolve the job.

**Kind**: instance method of <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>  
**See**

- [TrackedJob#event:jobSuccess](TrackedJob.md#TrackedJob+event_jobSuccess)
- [HubManager#event:jobSuccess](HubManager#event:jobSuccess)


| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobRunArg+reject"></a>

### jobRunArg.reject(error)
Call to reject the job.

**Kind**: instance method of <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>  
**See**

- [TrackedJob#event:jobFailure](TrackedJob.md#TrackedJob+event_jobFailure)
- [HubManager#event:jobFailure](HubManager#event:jobFailure)


| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobRunArg+sendProgress"></a>

### jobRunArg.sendProgress(progress) ⇒ <code>Promise</code>
Send progress data.

**Kind**: instance method of <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>  
**Returns**: <code>Promise</code> - Resolves once the progress is sent, and rejects if there was an error sending the progress.  
**See**

- [TrackedJob#event:jobProgress](TrackedJob.md#TrackedJob+event_jobProgress)
- [HubManager#event:jobProgress](HubManager#event:jobProgress)


| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

