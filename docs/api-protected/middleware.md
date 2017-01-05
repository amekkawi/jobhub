# [jobhub Extended API](README.md): Middleware:

<a name="loadJobs"></a>

## loadJobs(jobs, next)
Intercepts loading and registering of jobs from
[HubManagerOptions#jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath) by [HubManager#start](HubManager.md#HubManager+start).

**Kind**: global function  
**Category**: middleware  
**this**: <code>[HubManager](HubManager.md#HubManager)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| jobs | <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code> | 
| next | <code>function</code> | 

**Example**  
```javascript
hub.addSyncMiddleware('loadJobs', function(jobs, next) {
    // Load a special job
    jobs.registerJob('check-power-level', {
        run: function(job) {
            job.resolve('> 9000');
        }
    });

    // Keep loading jobs
    next();
});
```
<a name="createJob"></a>

## createJob(jobId, jobConfig, params, next)
Intercepts creating a [TrackedJob](TrackedJob.md#TrackedJob) instance.

**Kind**: global function  
**Category**: middleware  
**this**: <code>[HubManager](HubManager.md#HubManager)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| jobId | <code>string</code> | 
| jobConfig | <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| params | <code>\*</code> | 
| next | <code>function</code> | 

**Example**  
```javascript
hub.addSyncMiddleware('createJob', function(jobId, jobConfig, params, next) {
    // Get the result of the middleware
    var trackedJob = next();

    // Set a custom property to the trackedJob
    trackedJob.mySpecialProp = 500;

    return trackedJob;
});
```
<a name="workerLoadJob"></a>

## workerLoadJob(jobs, jobName)
Intercepts creation of the [JobRunArg](JobRunArg.md#JobRunArg) provided to [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: global function  
**Category**: middleware  
**this**: <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| jobs | <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code> | 
| jobName | <code>string</code> | 

**Example**  
```javascript
// Place in script specified by [HubManagerOptions#initModulePath](HubManagerOptions.md#HubManagerOptions+initModulePath)
exports.initWorker = function(jobWorker) {
    jobWorker.addSyncMiddleware('workerLoadJob', function(jobs, jobName, next) {
        if (jobName === 'bigJobDependencies') {
            // Register just the job needed
            jobs.registerJob(jobName, require('path/to/bigjob.js'));
        }
        else {
            // Load all jobs like normal
            next();
        }
    });
};
```
<a name="workerBuildJobArg"></a>

## workerBuildJobArg(jobId, params, resolve, reject, sendProgress, onAbort) ⇒ <code>[JobRunArg](JobRunArg.md#JobRunArg)</code>
Intercepts creation of the [JobRunArg](JobRunArg.md#JobRunArg) provided to [JobConfig#run](JobConfig.md#JobConfig+run).

**Kind**: global function  
**Category**: middleware  
**this**: <code>[JobWorker](JobWorker.md#JobWorker)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| jobId | <code>string</code> | 
| params | <code>\*</code> | 
| resolve | <code>function</code> | 
| reject | <code>function</code> | 
| sendProgress | <code>function</code> | 
| onAbort | <code>function</code> | 

**Example**  
```javascript
// Place in script specified by [HubManagerOptions#initModulePath](HubManagerOptions.md#HubManagerOptions+initModulePath)
exports.initWorker = function(jobWorker) {
    jobWorker.addSyncMiddleware('createWorkerMediator', function(jobId, params, resolve, reject, sendProgress, onAbort, next) {
        var jobArg = next(); // or use arguments[arguments.length - 1]();

        // Add custom props
        jobArg.myCustomOperation = function() { ... };

        return jobArg;
    });
};
```
<a name="forkJobProcess"></a>

## forkJobProcess(forkModulePath, forkArgs, forkOpts, next) ⇒ <code>ChildProcess</code>
Intercepts forking the local child process using `require("child_process").fork`.

**Kind**: global function  
**Category**: middleware  
**this**: <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
**Access:** protected  

| Param | Type | Description |
| --- | --- | --- |
| forkModulePath | <code>string</code> | Set from [HubManagerOptions#forkModulePath](HubManagerOptions.md#HubManagerOptions+forkModulePath) and passed as first argument of `require("child_process").fork`. |
| forkArgs | <code>Array.&lt;string&gt;</code> | Created by [buildForkArgs](middleware.md#buildForkArgs) and passed as second argument of `require("child_process").fork`. |
| forkOpts | <code>object</code> | Created by [buildForkOpts](middleware.md#buildForkOpts) and passed as third argument of `require("child_process").fork`. |
| next | <code>function</code> |  |

**Example**  
```javascript
hub.addSyncMiddleware('forkJobProcess', function(trackedJob, next) {
    return next().on('message', function(message) {
        // Custom message handling of ChildProcess message events
    });
});
```
<a name="buildForkArgs"></a>

## buildForkArgs(trackedJob, next) ⇒ <code>Array.&lt;string&gt;</code>
Intercepts creation of args provided to [forkJobProcess](middleware.md#forkJobProcess).

**Kind**: global function  
**Category**: middleware  
**this**: <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| next | <code>function</code> | 

**Example**  
```javascript
hub.addSyncMiddleware('buildForkArgs', function(trackedJob, next) {
    return next().concat([
        '--my-custom-flag'
    ]);
});
```
<a name="buildForkOpts"></a>

## buildForkOpts(trackedJob, next) ⇒ <code>object</code>
Intercepts creation of opts provided to [forkJobProcess](middleware.md#forkJobProcess).

**Kind**: global function  
**Category**: middleware  
**this**: <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| next | <code>function</code> | 

**Example**  
```javascript
hub.addSyncMiddleware('buildForkOpts', function(trackedJob, next) {
    return Object.assign(next(), {
        env: {
            CUSTOM_ENV: 'my-value'
        }
    });
});
```
<a name="createWorkerMediator"></a>

## createWorkerMediator(trackedJob, next) ⇒ <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code>
Intercepts creation of the [JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator) set to [TrackedJob#workerMediator](TrackedJob.md#TrackedJob+workerMediator).

**Kind**: global function  
**Returns**: <code>[JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator)</code> - - Implementation of [JobWorkerMediator](JobWorkerMediator.md#JobWorkerMediator), which is [JobWorkerIPCMediator](JobWorkerIPCMediator.md#JobWorkerIPCMediator) by default.  
**Category**: middleware  
**this**: <code>[TrackedJob](TrackedJob.md#TrackedJob)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 
| next | <code>function</code> | 

**Example**  
```javascript
hub.addSyncMiddleware('createWorkerMediator', function(trackedJob, next) {
    // Return a custom implementation that runs jobs on remote servers
    return RemoteJobMediator(trackedJob);
});
```
