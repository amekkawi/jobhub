# [jobhub Extended API](README.md): Class:

<a name="InvalidJobParamError"></a>

## InvalidJobParamError ⇐ <code>Error</code>
A InvalidJobParamError object indicates that params
did not validate for a specific [JobConfig](JobConfig.md#JobConfig).

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message. |
| paramName | <code>string</code> &#124; <code>void</code> | The name of the invalid param, if applicable. |
| paramValue | <code>string</code> &#124; <code>void</code> | The value of the invalid param, if applicable. |

<a name="new_InvalidJobParamError_new"></a>

### new InvalidJobParamError(message, [paramName], [paramValue])

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message. |
| [paramName] | <code>string</code> | The name of the invalid param, if applicable. |
| [paramValue] | <code>string</code> | The value of the invalid param, if applicable. |

