# [jobhub Extended API](README.md): Class:

<a name="JobExecutorBuiltin"></a>

## JobExecutorBuiltin ⇐ <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
Manages running jobs that have been queued using [HubManager#queueJob](HubManager.md#HubManager+queueJob).

**Kind**: global class  
**Extends:** <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>  

* [JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin) ⇐ <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
    * [new JobExecutorBuiltin(options, manager)](JobExecutorBuiltin.md#JobExecutorBuiltin)
    * _instance_
        * [.options](JobExecutorBuiltin.md#JobExecutor+options) : <code>object</code>
        * [.manager](JobExecutorBuiltin.md#JobExecutor+manager) : <code>[HubManager](HubManager.md#HubManager)</code>
        * [.add(trackedJob)](JobExecutorBuiltin.md#JobExecutorBuiltin+add)
        * [.getStatus()](JobExecutorBuiltin.md#JobExecutorBuiltin+getStatus) ⇒ <code>Object</code>
    * _static_
        * [.parseOptions(options, defaultOptions)](JobExecutorBuiltin.md#JobExecutorBuiltin.parseOptions) ⇒ <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>
        * [.getDefaultOptions()](JobExecutorBuiltin.md#JobExecutorBuiltin.getDefaultOptions) ⇒ <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>

<a name="new_JobExecutorBuiltin_new"></a>

### new JobExecutorBuiltin(options, manager)

| Param | Type |
| --- | --- |
| options | <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code> | 
| manager | <code>[HubManager](HubManager.md#HubManager)</code> | 

<a name="JobExecutor+options"></a>

### jobExecutorBuiltin.options : <code>object</code>
**Kind**: instance property of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  
**Access:** protected  
<a name="JobExecutor+manager"></a>

### jobExecutorBuiltin.manager : <code>[HubManager](HubManager.md#HubManager)</code>
**Kind**: instance property of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  
**Access:** protected  
<a name="JobExecutorBuiltin+add"></a>

### jobExecutorBuiltin.add(trackedJob)
Add a tracked job to be run.

**Kind**: instance method of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  
**Overrides:** <code>[add](JobExecutor.md#JobExecutor+add)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="JobExecutorBuiltin+getStatus"></a>

### jobExecutorBuiltin.getStatus() ⇒ <code>Object</code>
Get detail about queued and running jobs.

Returns:
* `maxConcurrent` - Maximum concurrent jobs that can run.
* `runningCount` - Number of running jobs.
* `queuedCount` - Number of jobs waiting to run.

**Kind**: instance method of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  
**Overrides:** <code>[getStatus](JobExecutor.md#JobExecutor+getStatus)</code>  
<a name="JobExecutorBuiltin.parseOptions"></a>

### JobExecutorBuiltin.parseOptions(options, defaultOptions) ⇒ <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>
Parse the JobExecutorBuiltin's options. Called by [HubManager](HubManager.md#HubManager).

**Kind**: static method of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  

| Param | Type |
| --- | --- |
| options | <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code> | 
| defaultOptions | <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code> | 

<a name="JobExecutorBuiltin.getDefaultOptions"></a>

### JobExecutorBuiltin.getDefaultOptions() ⇒ <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>
Get the default options for the JobExecutorBuiltin. Called by [HubManager](HubManager.md#HubManager).

**Kind**: static method of <code>[JobExecutorBuiltin](JobExecutorBuiltin.md#JobExecutorBuiltin)</code>  
