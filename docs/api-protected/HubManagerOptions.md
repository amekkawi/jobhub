<a name="HubManagerOptions"></a>

## HubManagerOptions : <code>object</code>
Configuration options for the [HubManager](HubManager.md#HubManager).

**Kind**: global typedef  

* [HubManagerOptions](HubManagerOptions.md#HubManagerOptions) : <code>object</code>
    * [.jobsModulePath](HubManagerOptions.md#HubManagerOptions+jobsModulePath) : <code>string</code>
    * [.initModulePath](HubManagerOptions.md#HubManagerOptions+initModulePath) : <code>null</code> &#124; <code>string</code>
    * [.forkModulePath](HubManagerOptions.md#HubManagerOptions+forkModulePath) : <code>string</code>
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