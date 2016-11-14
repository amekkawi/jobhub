# [jobhub Extended API](README.md): Class:

<a name="JobWorkerIPCMediator"></a>

## JobWorkerIPCMediator ⇐ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Manages a job's forked process during it's normal life cycle.

**Kind**: global class  
**Extends:** <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  

* [JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator) ⇐ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * [new JobWorkerIPCMediator(trackedJob)](JobWorkerIPCMediator.md#JobWorkerIPCMediator)
    * [.childProcess](JobWorkerIPCMediator.md#JobWorkerIPCMediator+childProcess) : <code>ChildProcess</code> &#124; <code>null</code>
    * [.trackedJob](JobWorkerIPCMediator.md#JobWorkerMediator+trackedJob) : <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * [.started](JobWorkerIPCMediator.md#JobWorkerMediator+started) : <code>boolean</code>
    * [.settled](JobWorkerIPCMediator.md#JobWorkerMediator+settled) : <code>boolean</code>
    * [.exited](JobWorkerIPCMediator.md#JobWorkerMediator+exited) : <code>boolean</code>
    * [.processId](JobWorkerIPCMediator.md#JobWorkerMediator+processId) : <code>null</code> &#124; <code>string</code>
    * [.addChildListeners()](JobWorkerIPCMediator.md#JobWorkerIPCMediator+addChildListeners)
    * [.handleStartupConfirmation()](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleStartupConfirmation)
    * [.handleChildMessage(message)](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleChildMessage)
    * [.handleChildDisconnect()](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleChildDisconnect)
    * [.handleChildError(err)](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleChildError)
    * [.handleChildClose(code, signal)](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleChildClose)
    * [.handleChildExit()](JobWorkerIPCMediator.md#JobWorkerIPCMediator+handleChildExit)
    * [.startWorker()](JobWorkerIPCMediator.md#JobWorkerMediator+startWorker) ⇒ <code>Promise</code>
    * [.stopMediation()](JobWorkerIPCMediator.md#JobWorkerMediator+stopMediation) ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * *[.terminate([forceKill])](JobWorkerIPCMediator.md#JobWorkerMediator+terminate)*
    * *[.execWorker()](JobWorkerIPCMediator.md#JobWorkerMediator+execWorker) ⇒ <code>void</code> &#124; <code>Promise</code>*
    * [.initStartupTimeout()](JobWorkerIPCMediator.md#JobWorkerMediator+initStartupTimeout)
    * [.beginStartupTimeout(timeout)](JobWorkerIPCMediator.md#JobWorkerMediator+beginStartupTimeout)
    * [.handleSuccess(result)](JobWorkerIPCMediator.md#JobWorkerMediator+handleSuccess)
    * [.handleProgress(progress)](JobWorkerIPCMediator.md#JobWorkerMediator+handleProgress)
    * [.handleError(error)](JobWorkerIPCMediator.md#JobWorkerMediator+handleError)
    * [.handleExit()](JobWorkerIPCMediator.md#JobWorkerMediator+handleExit)
    * [.handleStartupTimeout()](JobWorkerIPCMediator.md#JobWorkerMediator+handleStartupTimeout)
    * ["jobProgress" (progress)](JobWorkerIPCMediator.md#JobWorkerMediator+event_jobProgress)
    * ["jobSuccess" (result)](JobWorkerIPCMediator.md#JobWorkerMediator+event_jobSuccess)
    * ["jobFailure" (error)](JobWorkerIPCMediator.md#JobWorkerMediator+event_jobFailure)
    * ["jobExit"](JobWorkerIPCMediator.md#JobWorkerMediator+event_jobExit)

<a name="new_JobWorkerIPCMediator_new"></a>

### new JobWorkerIPCMediator(trackedJob)

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="JobWorkerIPCMediator+childProcess"></a>

### jobWorkerIPCMediator.childProcess : <code>ChildProcess</code> &#124; <code>null</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+trackedJob"></a>

### jobWorkerIPCMediator.trackedJob : <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+started"></a>

### jobWorkerIPCMediator.started : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+settled"></a>

### jobWorkerIPCMediator.settled : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+exited"></a>

### jobWorkerIPCMediator.exited : <code>boolean</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+processId"></a>

### jobWorkerIPCMediator.processId : <code>null</code> &#124; <code>string</code>
**Kind**: instance property of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Overrides:** <code>[processId](JobWorkerMediator.md#JobWorkerMediator+processId)</code>  
<a name="JobWorkerIPCMediator+addChildListeners"></a>

### jobWorkerIPCMediator.addChildListeners()
Add event listeners to ChildProcess.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerIPCMediator+handleStartupConfirmation"></a>

### jobWorkerIPCMediator.handleStartupConfirmation()
Called when the job sends the 'startup' message signalling it
has successfully initialized and is ready for the params payload.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Overrides:** <code>[handleStartupConfirmation](JobWorkerMediator.md#JobWorkerMediator+handleStartupConfirmation)</code>  
**Access:** protected  
<a name="JobWorkerIPCMediator+handleChildMessage"></a>

### jobWorkerIPCMediator.handleChildMessage(message)
Handle 'message' ChildProcess events.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| message | <code>\*</code> | 

<a name="JobWorkerIPCMediator+handleChildDisconnect"></a>

### jobWorkerIPCMediator.handleChildDisconnect()
Handle a 'disconnect' ChildProcess event.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerIPCMediator+handleChildError"></a>

### jobWorkerIPCMediator.handleChildError(err)
Handle a 'error' ChildProcess event.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="JobWorkerIPCMediator+handleChildClose"></a>

### jobWorkerIPCMediator.handleChildClose(code, signal)
Handle an unexpected 'close' ChildProcess event.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| code | <code>number</code> &#124; <code>null</code> | 
| signal | <code>string</code> &#124; <code>null</code> | 

<a name="JobWorkerIPCMediator+handleChildExit"></a>

### jobWorkerIPCMediator.handleChildExit()
Handle an 'exit' ChildProcess event.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+startWorker"></a>

### jobWorkerIPCMediator.startWorker() ⇒ <code>Promise</code>
Execute and monitor the job's worker process.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
<a name="JobWorkerMediator+stopMediation"></a>

### jobWorkerIPCMediator.stopMediation() ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Stop mediating communication with the job's worker process and cleanup any timers.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Overrides:** <code>[stopMediation](JobWorkerMediator.md#JobWorkerMediator+stopMediation)</code>  
<a name="JobWorkerMediator+terminate"></a>

### *jobWorkerIPCMediator.terminate([forceKill])*
Terminate the job's worker process.

**Kind**: instance abstract method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Overrides:** <code>[terminate](JobWorkerMediator.md#JobWorkerMediator+terminate)</code>  

| Param | Type | Default |
| --- | --- | --- |
| [forceKill] | <code>boolean</code> | <code>false</code> | 

<a name="JobWorkerMediator+execWorker"></a>

### *jobWorkerIPCMediator.execWorker() ⇒ <code>void</code> &#124; <code>Promise</code>*
Execute the worker process and begin mediating communication with it.

**Kind**: instance abstract method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Overrides:** <code>[execWorker](JobWorkerMediator.md#JobWorkerMediator+execWorker)</code>  
**Returns**: <code>void</code> &#124; <code>Promise</code> - Resolves immediately after the process is spawned.  
**Access:** protected  
<a name="JobWorkerMediator+initStartupTimeout"></a>

### jobWorkerIPCMediator.initStartupTimeout()
Check if a timeout for the worker's startup should begin.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+beginStartupTimeout"></a>

### jobWorkerIPCMediator.beginStartupTimeout(timeout)
Begin the timer for the worker's startup timeout.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type | Description |
| --- | --- | --- |
| timeout | <code>number</code> | Timeout period in milliseconds. |

<a name="JobWorkerMediator+handleSuccess"></a>

### jobWorkerIPCMediator.handleSuccess(result)
Called when the job's worker process reports 'success'.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorkerMediator+handleProgress"></a>

### jobWorkerIPCMediator.handleProgress(progress)
Called when the job's worker process sends its 'progress'.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorkerMediator+handleError"></a>

### jobWorkerIPCMediator.handleError(error)
Handle an error.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobWorkerMediator+handleExit"></a>

### jobWorkerIPCMediator.handleExit()
Handle the job's worker process exiting.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+handleStartupTimeout"></a>

### jobWorkerIPCMediator.handleStartupTimeout()
Handle the timeout for 'startup' being reached.

**Kind**: instance method of <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
**Access:** protected  
<a name="JobWorkerMediator+event_jobProgress"></a>

### "jobProgress" (progress)
Fired when the job's worker process sends its 'progress'.

**Kind**: event emitted by <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  

| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 

<a name="JobWorkerMediator+event_jobSuccess"></a>

### "jobSuccess" (result)
Fires when the job's worker process reports 'success'.

**Kind**: event emitted by <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  

| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobWorkerMediator+event_jobFailure"></a>

### "jobFailure" (error)
**Kind**: event emitted by <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobWorkerMediator+event_jobExit"></a>

### "jobExit"
Fires when the job's worker process exits.

**Kind**: event emitted by <code>[JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator)</code>  
