# [jobhub Extended API](README.md): Class:

<a name="InvalidJobConfigError"></a>

## InvalidJobConfigError ⇐ <code>Error</code>
An InvalidJobConfigError object indicates that a [JobConfig](JobConfig.md#JobConfig) has
an invalid value for a specific property.

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| jobName | <code>string</code> | The name of the job. |
| propName | <code>string</code> | The name of the job config property. |

<a name="new_InvalidJobConfigError_new"></a>

### new InvalidJobConfigError(message, jobName, propName)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message. |
| jobName | <code>string</code> | The name of the job. |
| propName | <code>string</code> | The name of the job config property. |

