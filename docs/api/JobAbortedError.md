# [jobhub API](README.md): Class:

<a name="JobAbortedError"></a>

## JobAbortedError ⇐ <code>Error</code>
A JobAbortedError object indicates that a forked job has been aborted by calling [TrackedJob#abort](TrackedJob.md#TrackedJob+abort).

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| jobName | <code>string</code> | The name of the job. |
| jobId | <code>string</code> | The job's ID. |
| abortReason | <code>string</code> | TODO |

<a name="new_JobAbortedError_new"></a>

### new JobAbortedError(jobName, jobId, abortReason)

| Param | Type | Description |
| --- | --- | --- |
| jobName | <code>string</code> | The name of the job. |
| jobId | <code>string</code> | The job's ID. |
| abortReason | <code>string</code> | TODO |

