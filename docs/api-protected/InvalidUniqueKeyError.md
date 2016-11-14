# [jobhub Extended API](README.md): Class:

<a name="InvalidUniqueKeyError"></a>

## InvalidUniqueKeyError ⇐ <code>Error</code>
An InvalidUniqueKeyError object indicates that a [JobConfig#uniqueKey](JobConfig.md#JobConfig+uniqueKey) returned an invalid value.

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| keyValue | <code>string</code> | The invalid unique key value. |
| jobName | <code>string</code> | The name of the job. |

<a name="new_InvalidUniqueKeyError_new"></a>

### new InvalidUniqueKeyError(keyValue, jobName)

| Param | Type | Description |
| --- | --- | --- |
| keyValue | <code>string</code> | The value of the invalid key. |
| jobName | <code>string</code> | The name of the job. |

