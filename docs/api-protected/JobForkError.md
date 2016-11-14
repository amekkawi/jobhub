<a name="JobForkError"></a>

## JobForkError ⇐ <code>Error</code>
A JobForkError object indicates that a forked job encountered an error.

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| jobName | <code>string</code> | The name of the job. |
| jobId | <code>string</code> | The job's ID. |
| error | <code>object</code> &#124; <code>Error</code> &#124; <code>void</code> | Error detail, if applicable. |
| code | <code>number</code> &#124; <code>void</code> | Process exit code, if applicable. |
| signal | <code>string</code> &#124; <code>void</code> | Process exit signal, if applicable. |

<a name="new_JobForkError_new"></a>

### new JobForkError(message, jobName, jobId, [options])

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message. |
| jobName | <code>string</code> | The name of the job. |
| jobId | <code>string</code> | The job's ID. |
| [options] | <code>object</code> | Additional detail to include with the error. |
| [options.error] | <code>object</code> &#124; <code>Error</code> &#124; <code>void</code> | Error detail, if applicable. |
| [options.code] | <code>number</code> &#124; <code>void</code> | Process exit code, if applicable. |
| [options.signal] | <code>string</code> &#124; <code>void</code> | Process exit signal, if applicable. |

