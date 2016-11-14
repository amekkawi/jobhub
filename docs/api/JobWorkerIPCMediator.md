# [jobhub API](README.md): Class:

<a name="JobWorkerIPCMediator"></a>

## JobWorkerIPCMediator ⇐ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Manages a job's forked process during it's normal lifecycle.

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
    * [.startWorker()](JobWorkerIPCMediator.md#JobWorkerMediator+startWorker) ⇒ <code>Promise</code>
    * [.stopMediation()](JobWorkerIPCMediator.md#JobWorkerMediator+stopMediation) ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * *[.terminate([forceKill])](JobWorkerIPCMediator.md#JobWorkerMediator+terminate)*
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
