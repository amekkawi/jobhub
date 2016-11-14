# [jobhub API](README.md): Class:

<a name="MiddlewareStore"></a>

## MiddlewareStore
Plugins to customize functionality of jobhub.

**Kind**: global class  

* [MiddlewareStore](MiddlewareStore.md#MiddlewareStore)
    * [.addSupportedSyncTypes(types)](MiddlewareStore.md#MiddlewareStore+addSupportedSyncTypes) ⇒ <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.addSupportedAsyncTypes(types)](MiddlewareStore.md#MiddlewareStore+addSupportedAsyncTypes) ⇒ <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
    * [.addSyncMiddlware(type, middleware, [priority])](MiddlewareStore.md#MiddlewareStore+addSyncMiddlware)
    * [.addAsyncMiddlware(type, middleware, [priority])](MiddlewareStore.md#MiddlewareStore+addAsyncMiddlware)
    * [.hasSyncSupport(type)](MiddlewareStore.md#MiddlewareStore+hasSyncSupport) ⇒ <code>boolean</code>
    * [.hasAsyncSupport(type)](MiddlewareStore.md#MiddlewareStore+hasAsyncSupport) ⇒ <code>boolean</code>
    * [.getSupportedSyncTypes()](MiddlewareStore.md#MiddlewareStore+getSupportedSyncTypes) ⇒ <code>Array.&lt;string&gt;</code>
    * [.getSupportedAsyncTypes()](MiddlewareStore.md#MiddlewareStore+getSupportedAsyncTypes) ⇒ <code>Array.&lt;string&gt;</code>
    * [.removeSyncMiddlware(type, middleware)](MiddlewareStore.md#MiddlewareStore+removeSyncMiddlware)
    * [.removeAsyncMiddlware(type, middleware)](MiddlewareStore.md#MiddlewareStore+removeAsyncMiddlware)
    * [.runSyncMiddleware(type, context, args, next)](MiddlewareStore.md#MiddlewareStore+runSyncMiddleware) ⇒ <code>\*</code>
    * [.runAsyncMiddleware(type, context, args, next)](MiddlewareStore.md#MiddlewareStore+runAsyncMiddleware) ⇒ <code>Promise</code>

<a name="MiddlewareStore+addSupportedSyncTypes"></a>

### middlewareStore.addSupportedSyncTypes(types) ⇒ <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
Add supported sync middleware types.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| types | <code>Array.&lt;string&gt;</code> | 

<a name="MiddlewareStore+addSupportedAsyncTypes"></a>

### middlewareStore.addSupportedAsyncTypes(types) ⇒ <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>
Add supported async middleware types.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| types | <code>Array.&lt;string&gt;</code> | 

<a name="MiddlewareStore+addSyncMiddlware"></a>

### middlewareStore.addSyncMiddlware(type, middleware, [priority])
Add a sync middleware.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
**Throws**:

- <code>[UnsupportedMiddlewareTypeError](UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError)</code> 


| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> |  | 
| middleware | <code>function</code> |  | 
| [priority] | <code>number</code> | <code>100</code> | 

<a name="MiddlewareStore+addAsyncMiddlware"></a>

### middlewareStore.addAsyncMiddlware(type, middleware, [priority])
Add an async middleware.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
**Throws**:

- <code>[UnsupportedMiddlewareTypeError](UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError)</code> 


| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> |  | 
| middleware | <code>function</code> |  | 
| [priority] | <code>number</code> | <code>100</code> | 

<a name="MiddlewareStore+hasSyncSupport"></a>

### middlewareStore.hasSyncSupport(type) ⇒ <code>boolean</code>
Get if a sync middleware type is supported.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<a name="MiddlewareStore+hasAsyncSupport"></a>

### middlewareStore.hasAsyncSupport(type) ⇒ <code>boolean</code>
Get if an async middleware type is supported.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<a name="MiddlewareStore+getSupportedSyncTypes"></a>

### middlewareStore.getSupportedSyncTypes() ⇒ <code>Array.&lt;string&gt;</code>
Get list of supported sync middleware types.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
<a name="MiddlewareStore+getSupportedAsyncTypes"></a>

### middlewareStore.getSupportedAsyncTypes() ⇒ <code>Array.&lt;string&gt;</code>
Get list of supported async middleware types.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
<a name="MiddlewareStore+removeSyncMiddlware"></a>

### middlewareStore.removeSyncMiddlware(type, middleware)
Remove a sync middleware.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
**Throws**:

- <code>[UnsupportedMiddlewareTypeError](UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError)</code> 


| Param | Type |
| --- | --- |
| type | <code>string</code> | 
| middleware | <code>function</code> | 

<a name="MiddlewareStore+removeAsyncMiddlware"></a>

### middlewareStore.removeAsyncMiddlware(type, middleware)
Remove an async middleware.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  
**Throws**:

- <code>[UnsupportedMiddlewareTypeError](UnsupportedMiddlewareTypeError.md#UnsupportedMiddlewareTypeError)</code> 


| Param | Type |
| --- | --- |
| type | <code>string</code> | 
| middleware | <code>function</code> | 

<a name="MiddlewareStore+runSyncMiddleware"></a>

### middlewareStore.runSyncMiddleware(type, context, args, next) ⇒ <code>\*</code>
Run sync middleware for the specified type, context and args.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 
| context | <code>\*</code> | 
| args | <code>Array</code> | 
| next | <code>function</code> | 

<a name="MiddlewareStore+runAsyncMiddleware"></a>

### middlewareStore.runAsyncMiddleware(type, context, args, next) ⇒ <code>Promise</code>
Run async middleware for the specified type, context and args.

**Kind**: instance method of <code>[MiddlewareStore](MiddlewareStore.md#MiddlewareStore)</code>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 
| context | <code>\*</code> | 
| args | <code>Array</code> | 
| next | <code>function</code> | 

