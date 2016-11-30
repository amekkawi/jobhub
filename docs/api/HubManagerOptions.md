# [jobhub API](README.md): Typedef:

<a name="HubManagerOptions"></a>

## HubManagerOptions : <code>object</code>
Configuration options for the [HubManager](HubManager.md#HubManager).

**Kind**: global typedef  

* [HubManagerOptions](HubManagerOptions.md#HubManagerOptions) : <code>object</code>
    * [.jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath) : <code>string</code>
    * [.initModulePath](HubManagerOptions.md#HubManagerOptions+initModulePath) : <code>null</code> &#124; <code>string</code>
    * [.forkModulePath](HubManagerOptions.md#HubManagerOptions+forkModulePath) : <code>string</code>
    * [.jobExecutorClass](HubManagerOptions.md#HubManagerOptions+jobExecutorClass) : <code>function</code> &#124; <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
    * [.jobExecutorOptions](HubManagerOptions.md#HubManagerOptions+jobExecutorOptions) : <code>object</code> &#124; <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>
    * [.terminationSIGTERMTimeout](HubManagerOptions.md#HubManagerOptions+terminationSIGTERMTimeout) : <code>number</code>
    * [.terminationSIGKILLTimeout](HubManagerOptions.md#HubManagerOptions+terminationSIGKILLTimeout) : <code>number</code>
    * [.workerStartupTimeout](HubManagerOptions.md#HubManagerOptions+workerStartupTimeout) : <code>number</code>
    * [.createId](HubManagerOptions.md#HubManagerOptions+createId) : <code>function</code>

<a name="HubManagerOptions+jobsModulePath"></a>

### hubManagerOptions.jobsModulePath : <code>string</code>
Path to node module that defines job config.

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
<a name="HubManagerOptions+initModulePath"></a>

### hubManagerOptions.initModulePath : <code>null</code> &#124; <code>string</code>
Path to node module that initializes workers.

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>null</code>  
<a name="HubManagerOptions+forkModulePath"></a>

### hubManagerOptions.forkModulePath : <code>string</code>
Path to node script used to fork the child processes.

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>&quot;jobhub/lib/worker.js&quot;</code>  
<a name="HubManagerOptions+jobExecutorClass"></a>

### hubManagerOptions.jobExecutorClass : <code>function</code> &#124; <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>
Overrides class used for [HubManager#jobExecutor](HubManager.md#HubManager+jobExecutor).

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>require(&#x27;jobhub/lib/JobExecutorBuiltin&#x27;)</code>  
<a name="HubManagerOptions+jobExecutorOptions"></a>

### hubManagerOptions.jobExecutorOptions : <code>object</code> &#124; <code>[JobExecutorBuiltinOptions](JobExecutorBuiltinOptions.md#JobExecutorBuiltinOptions)</code>
Option overrides passed to the [JobExecutor](JobExecutor.md#JobExecutor).

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>{}</code>  
<a name="HubManagerOptions+terminationSIGTERMTimeout"></a>

### hubManagerOptions.terminationSIGTERMTimeout : <code>number</code>
**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>60000</code>  
<a name="HubManagerOptions+terminationSIGKILLTimeout"></a>

### hubManagerOptions.terminationSIGKILLTimeout : <code>number</code>
**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>60000</code>  
<a name="HubManagerOptions+workerStartupTimeout"></a>

### hubManagerOptions.workerStartupTimeout : <code>number</code>
Number of milliseconds that a child process must confirm it has started up before its considered failed.

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>20000</code>  
<a name="HubManagerOptions+createId"></a>

### hubManagerOptions.createId : <code>function</code>
Function that generates the [TrackedJob#jobId](TrackedJob.md#TrackedJob+jobId).

**Kind**: instance property of <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>  
**Default**: <code>require(&#x27;uuid&#x27;).v4</code>  
