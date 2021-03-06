# [jobhub API](README.md): Class:

<a name="JobWorkerMediator"></a>

## JobWorkerMediator ⇐ <code>EventEmitter</code>
Responsible for forking the job's child worker process and mediating communication with it.

**Kind**: global class  
**Extends:** <code>EventEmitter</code>  
**Emits**: <code>[jobProgress](JobWorkerMediator.md#JobWorkerMediator+event_jobProgress)</code>, <code>[jobSuccess](JobWorkerMediator.md#JobWorkerMediator+event_jobSuccess)</code>, <code>[jobFailure](JobWorkerMediator.md#JobWorkerMediator+event_jobFailure)</code>, <code>[jobExit](JobWorkerMediator.md#JobWorkerMediator+event_jobExit)</code>  

* [JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator) ⇐ <code>EventEmitter</code>
    * [new JobWorkerMediator(trackedJob)](JobWorkerMediator.md#JobWorkerMediator)
    * [.trackedJob](JobWorkerMediator.md#JobWorkerMediator+trackedJob) : <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>
    * [.forked](JobWorkerMediator.md#JobWorkerMediator+forked) : <code>boolean</code>
    * [.started](JobWorkerMediator.md#JobWorkerMediator+started) : <code>boolean</code>
    * [.settled](JobWorkerMediator.md#JobWorkerMediator+settled) : <code>boolean</code>
    * [.exited](JobWorkerMediator.md#JobWorkerMediator+exited) : <code>boolean</code>
    * [.processId](JobWorkerMediator.md#JobWorkerMediator+processId) : <code>null</code> &#124; <code>string</code>
    * [.startWorker()](JobWorkerMediator.md#JobWorkerMediator+startWorker) ⇒ <code>Promise</code>
    * [.stopMediation()](JobWorkerMediator.md#JobWorkerMediator+stopMediation) ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
    * *[.terminate([forceKill])](JobWorkerMediator.md#JobWorkerMediator+terminate)*
    * *[.sendAbortMessage()](JobWorkerMediator.md#JobWorkerMediator+sendAbortMessage)*
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
<a name="JobWorkerMediator+forked"></a>

### jobWorkerMediator.forked : <code>boolean</code>
Set to true once [JobWorkerMediator#execWorker](JobWorkerMediator#execWorker) resolves.

**Kind**: instance property of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
<a name="JobWorkerMediator+started"></a>

### jobWorkerMediator.started : <code>boolean</code>
Set to true once [JobWorkerMediator#handleStartupConfirmation](JobWorkerMediator#handleStartupConfirmation) is called.

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
**Fulfil**: <code>void</code> Resolves after the worker process has been forked.  
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

<a name="JobWorkerMediator+sendAbortMessage"></a>

### *jobWorkerMediator.sendAbortMessage()*
Notify the job's worker process that the job is being aborted.

Should not be called directly. Instead use [TrackedJob#abort](TrackedJob.md#TrackedJob+abort).

**Kind**: instance abstract method of <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>  
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
