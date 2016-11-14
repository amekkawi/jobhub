<a name="module_jobhub/lib/util"></a>

## jobhub/lib/util
Helper utilities used by jobhub.

**Access:** protected  
**Example**  
```javascript
var errors = require("jobhub/lib/util");
```

* [jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)
    * [.getDefaultManagerOptions()](module_jobhub_lib_util.md#module_jobhub/lib/util.getDefaultManagerOptions) ⇒ <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.parseManagerOptions(options, defaultOptions)](module_jobhub_lib_util.md#module_jobhub/lib/util.parseManagerOptions) ⇒ <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
    * [.parseJobConfig(jobName, jobConfig)](module_jobhub_lib_util.md#module_jobhub/lib/util.parseJobConfig) ⇒ <code>[JobConfig](JobConfig.md#JobConfig)</code>
    * [.getUniqueKey(jobConfig, params)](module_jobhub_lib_util.md#module_jobhub/lib/util.getUniqueKey) ⇒ <code>string</code> &#124; <code>null</code>
    * [.validateJobParams(jobConfig, params)](module_jobhub_lib_util.md#module_jobhub/lib/util.validateJobParams) ⇒ <code>Promise</code>
    * [.onlyOneCallback(fn, ...callbacks)](module_jobhub_lib_util.md#module_jobhub/lib/util.onlyOneCallback) ⇒ <code>\*</code>
    * [.rejectOnThrow(reject, fn)](module_jobhub_lib_util.md#module_jobhub/lib/util.rejectOnThrow) ⇒ <code>function</code>
    * [.dehydrateError(err)](module_jobhub_lib_util.md#module_jobhub/lib/util.dehydrateError) ⇒ <code>object</code>
    * [.promiseTry(fn)](module_jobhub_lib_util.md#module_jobhub/lib/util.promiseTry) ⇒ <code>Promise</code>
    * [.objectValues(obj)](module_jobhub_lib_util.md#module_jobhub/lib/util.objectValues) ⇒ <code>Array</code>

<a name="module_jobhub/lib/util.getDefaultManagerOptions"></a>

### jobhub/lib/util.getDefaultManagerOptions() ⇒ <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
Get the default HubManager option values.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
<a name="module_jobhub/lib/util.parseManagerOptions"></a>

### jobhub/lib/util.parseManagerOptions(options, defaultOptions) ⇒ <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code>
Validate and normalize the manager options.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Throws**:

- <code>[InvalidManagerOptionsError](InvalidManagerOptionsError.md#InvalidManagerOptionsError)</code> 


| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| defaultOptions | <code>[HubManagerOptions](HubManagerOptions.md#HubManagerOptions)</code> | 

<a name="module_jobhub/lib/util.parseJobConfig"></a>

### jobhub/lib/util.parseJobConfig(jobName, jobConfig) ⇒ <code>[JobConfig](JobConfig.md#JobConfig)</code>
Validate and normalize the config for a job.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Throws**:

- <code>[InvalidJobConfigError](InvalidJobConfigError.md#InvalidJobConfigError)</code> 


| Param | Type |
| --- | --- |
| jobName | <code>string</code> | 
| jobConfig | <code>object</code> | 

<a name="module_jobhub/lib/util.getUniqueKey"></a>

### jobhub/lib/util.getUniqueKey(jobConfig, params) ⇒ <code>string</code> &#124; <code>null</code>
Get the key to identify unique tracked jobs, or null if a job does not have uniqueness.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Throws**:

- <code>[InvalidUniqueKeyError](InvalidUniqueKeyError.md#InvalidUniqueKeyError)</code> 


| Param | Type |
| --- | --- |
| jobConfig | <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| params | <code>\*</code> | 

<a name="module_jobhub/lib/util.validateJobParams"></a>

### jobhub/lib/util.validateJobParams(jobConfig, params) ⇒ <code>Promise</code>
Validate params for a job using optional 'validate' method in JobConfig.

It should throw errors or return a Promise for async validation.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  

| Param | Type |
| --- | --- |
| jobConfig | <code>[JobConfig](JobConfig.md#JobConfig)</code> | 
| params | <code>\*</code> | 

<a name="module_jobhub/lib/util.onlyOneCallback"></a>

### jobhub/lib/util.onlyOneCallback(fn, ...callbacks) ⇒ <code>\*</code>
Wrap a series of callbacks so once one is called, calls to the others are ignored.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Access:** protected  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> |  |
| ...callbacks | <code>function</code> | Two or more callbacks. |

<a name="module_jobhub/lib/util.rejectOnThrow"></a>

### jobhub/lib/util.rejectOnThrow(reject, fn) ⇒ <code>function</code>
Promise helper to catch errors thrown by fn and pass them to reject.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| reject | <code>function</code> | 
| fn | <code>function</code> | 

<a name="module_jobhub/lib/util.dehydrateError"></a>

### jobhub/lib/util.dehydrateError(err) ⇒ <code>object</code>
Extract non-object own props from an Error.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="module_jobhub/lib/util.promiseTry"></a>

### jobhub/lib/util.promiseTry(fn) ⇒ <code>Promise</code>
Wrap a function in a Promise to catch synchronous errors.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="module_jobhub/lib/util.objectValues"></a>

### jobhub/lib/util.objectValues(obj) ⇒ <code>Array</code>
Polyfill for Object.values.

**Kind**: static method of <code>[jobhub/lib/util](module_jobhub_lib_util.md#module_jobhub/lib/util)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| obj | <code>object</code> | 

