<a name="UnsupportedMiddlewareTypeError"></a>

## UnsupportedMiddlewareTypeError ⇐ <code>Error</code>
A UnsupportedMiddlewareTypeError object indicates that middleware
was attempted to be used that is not supported.

**Kind**: global class  
**Extends:** <code>Error</code>  
**Category**: errors  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| isAsync | <code>boolean</code> | Indicates if the async or sync middleware. |
| type | <code>string</code> | The type identifier of the middleware. |

<a name="new_UnsupportedMiddlewareTypeError_new"></a>

### new UnsupportedMiddlewareTypeError(isAsync, type)

| Param | Type | Description |
| --- | --- | --- |
| isAsync | <code>boolean</code> | Indicates if the async or sync middleware. |
| type | <code>string</code> | The type identifier of the middleware. |

