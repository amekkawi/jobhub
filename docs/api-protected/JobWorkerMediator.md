# [jobhub Extended API](README.md): Class:

<a name="JobWorkerMediator"></a>

## JobWorkerMediator ⇐ <code>EventEmitter</code>
Responsible for forking the job's child worker process and mediating communication with it.

**Kind**: global class  
**Extends:** <code>EventEmitter</code>  
**Emits**: <code>[jobProgress](JobWorkerMediator.md#JobWorkerMediator+event_jobProgress)</code>, <code>[jobSuccess](JobWorkerMediator.md#JobWorkerMediator+event_jobSuccess)</code>, <code>[jobFailure](JobWorkerMediator.md#JobWorkerMediator+event_jobFailure)</code>, <code>[jobExit](JobWorkerMediator.md#JobWorkerMediator+event_jobExit)</code>  

* [JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator) ⇐ <code>EventEmitter</code>
    * [new JobWorkerMediator(trackedJob)](JobWorkerMediator.md#JobWorkerMediator)
    * [.trackedJob](JobWorkerMediator.md#JobWorkerMediator+trackedJob) : <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * [.started](JobWorkerMediator.md#JobWorkerMediator+started) : <code>boolean</code>
    * [.settled](JobWorkerMediator.md#JobWorkerMediator+settled) : <code>boolean</code>
    * [.exited](JobWorkerMediator.md#JobWorkerMediator+exited) : <code>boolean</code>
    * [.processId](JobWorkerMediator.md#JobWorkerMediator+processId) : <code>null</code> &#124; <code>string</code>
    * [.startWorker()](JobWorkerMediator.md#JobWorkerMediator+startWorker) ⇒ <code>Promise</code>
    * [.stopMediation()](JobWorkerMediator.md#JobWorkerMediator+stopMediation) ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * *[.terminate([forceKill])](JobWorkerMediator.md#JobWorkerMediator+terminate)*
    * *[.execWorker()](JobWorkerMediator.md#JobWorkerMediator+execWorker) ⇒ <code>void</code> &#124; <code>Promise</code>*
    * [.initStartupTimeout()](JobWorkerMediator.md#JobWorkerMediator+initStartupTimeout)
    * [.beginStartupTimeout(timeout)](JobWorkerMediator.md#JobWorkerMediator+beginStartupTimeout)
    * [.handleStartupConfirmation()](JobWorkerMediator.md#JobWorkerMediator+handleStartupConfirmation)
    * [.handleSuccess(result)](JobWorkerMediator.md#JobWorkerMediator+handleSuccess)
    * [.handleProgress(progress)](JobWorkerMediator.md#JobWorkerMediator+handleProgress)
    * [.handleError(error)](JobWorkerMediator.md#JobWorkerMediator+handleError)
    * [.handleExit()](JobWorkerMediator.md#JobWorkerMediator+handleExit)
    * [.handleStartupTimeout()](JobWorkerMediator.md#JobWorkerMediator+handleStartupTimeout)
    * ["jobProgress" (progress)](JobWorkerMediator.md#JobWorkerMediator+event_jobProgress)
    * ["jobSuccess" (result)](JobWorkerMediator.md#JobWorkerMediator+event_jobSuccess)
    * ["jobFailure" (error)](JobWorkerMediator.md#JobWorkerMediator+event_jobFailure)
    * ["jobExit"](JobWorkerMediator.md#JobWorkerMediator+event_jobExit)

<a name="new_JobWorkerMediator_new"></a>

### new JobWorkerMediator(trackedJob)

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="JobWorkerMediator+trackedJob"></a>

### jobWorkerMediator.trackedJob : <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+started"></a>

### jobWorkerMediator.started : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+settled"></a>

### jobWorkerMediator.settled : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+exited"></a>

### jobWorkerMediator.exited : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+processId"></a>

### jobWorkerMediator.processId : <code>null</code> &#124; <code>string</code>
**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+startWorker"></a>

### jobWorkerMediator.startWorker() ⇒ <code>Promise</code>
Execute job's worker process and begin mediation of communication with it.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+stopMediation"></a>

### jobWorkerMediator.stopMediation() ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Stop mediating communication with the job's worker process and cleanup any timers.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+terminate"></a>

### *jobWorkerMediator.terminate([forceKill])*
Terminate the job's worker process.

**Kind**: instance abstract method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  

| Param | Type | Default |
| --- | --- | --- |
| [forceKill] | <code>boolean</code> | <code>false</code> | 

<a name="JobWorkerMediator+execWorker"></a>

### *jobWorkerMediator.execWorker() ⇒ <code>void</code> &#124; <code>Promise</code>*
Execute the worker process and begin mediating communication with it.

**Kind**: instance abstract method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Returns**: <code>void</code> &#124; <code>Promise</code> - Resolves immediately after the process is spawned.  
**Access:** protected  
<a name="JobWorkerMediator+initStartupTimeout"></a>

### jobWorkerMediator.initStartupTimeout()
Check if a timeout for the worker's startup should begin.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+beginStartupTimeout"></a>

### jobWorkerMediator.beginStartupTimeout(timeout)
Begin the timer for the worker's startup timeout.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  

| Param | Type | Description |
| --- | --- | --- |
| timeout | <code>number</code> | Timeout period in milliseconds. |

<a name="JobWorkerMediator+handleStartupConfirmation"></a>

### jobWorkerMediator.handleStartupConfirmation()
Called when the job's worker process confirms it has successfully initialized.

This will stop the startup timeout, if one is running.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+handleSuccess"></a>

### jobWorkerMediator.handleSuccess(result)
Called when the job's worker process reports 'success'.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorkerMediator+handleProgress"></a>

### jobWorkerMediator.handleProgress(progress)
Called when the job's worker process sends its 'progress'.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorkerMediator+handleError"></a>

### jobWorkerMediator.handleError(error)
Handle an error.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobWorkerMediator+handleExit"></a>

### jobWorkerMediator.handleExit()
Handle the job's worker process exiting.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+handleStartupTimeout"></a>

### jobWorkerMediator.handleStartupTimeout()
Handle the timeout for 'startup' being reached.

**Kind**: instance method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+event_jobProgress"></a>

### "jobProgress" (progress)
Fired when the job's worker process sends its 'progress'.

**Kind**: event emitted by <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorkerMediator+event_jobSuccess"></a>

### "jobSuccess" (result)
Fires when the job's worker process reports 'success'.

**Kind**: event emitted by <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorkerMediator+event_jobFailure"></a>

### "jobFailure" (error)
**Kind**: event emitted by <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobWorkerMediator+event_jobExit"></a>

### "jobExit"
Fires when the job's worker process exits.

**Kind**: event emitted by <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
