<a name="JobWorkerHandlerError"></a>

## JobWorkerHandlerError ⇐ <code>Error</code>
A JobWorkerHandlerError indicates that an error was caught
while handling the successful or failed result of a job.

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  

* [JobWorkerHandlerError](JobWorkerHandlerError.md#JobWorkerHandlerError) ⇐ <code>Error</code>
    * [new JobWorkerHandlerError(type, original, error)](JobWorkerHandlerError.md#JobWorkerHandlerError)
    * [.TYPES](JobWorkerHandlerError.md#JobWorkerHandlerError.TYPES) : <code>enum</code>

<a name="new_JobWorkerHandlerError_new"></a>

### new JobWorkerHandlerError(type, original, error)

| Param | Type | Description |
| --- | --- | --- |
| type | <code>[TYPES](JobWorkerHandlerError.md#JobWorkerHandlerError.TYPES)</code> | Identifies if the error was caught during a success or error handler. |
| original | <code>Error</code> &#124; <code>object</code> | The successful result or the original Error. |
| error | <code>Error</code> | The error that was caught while handling success. |

<a name="JobWorkerHandlerError.TYPES"></a>

### JobWorkerHandlerError.TYPES : <code>enum</code>
Values for [JobWorkerHandlerError](JobWorkerHandlerError.md#JobWorkerHandlerError)#type.

**Kind**: static enum of <code>[JobWorkerHandlerError](JobWorkerHandlerError.md#JobWorkerHandlerError)</code>  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| SUCCESS | <code>string</code> | <code>&quot;SUCCESS&quot;</code> | 
| ERROR | <code>string</code> | <code>&quot;ERROR&quot;</code> | 

