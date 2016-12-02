# [jobhub Extended API](README.md): Class:

<a name="JobExecutor"></a>

## *JobExecutor*
Manages running jobs that have been queued using [HubManager#queueJob](HubManager.md#HubManager+queueJob).

**Kind**: global abstract class  

* *[JobExecutor](JobExecutor.md#JobExecutor)*
    * *[new JobExecutor(options, manager)](JobExecutor.md#JobExecutor)*
    * *[.options](JobExecutor.md#JobExecutor+options) : <code>object</code>*
    * *[.manager](JobExecutor.md#JobExecutor+manager) : <code>[HubManager](HubManager.md#HubManager)</code>*
    * **[.add(trackedJob)](JobExecutor.md#JobExecutor+add)**
    * **[.getStatus()](JobExecutor.md#JobExecutor+getStatus) ⇒ <code>object</code>**

<a name="new_JobExecutor_new"></a>

### *new JobExecutor(options, manager)*

| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| manager | <code>[HubManager](HubManager.md#HubManager)</code> | 

<a name="JobExecutor+options"></a>

### *jobExecutor.options : <code>object</code>*
**Kind**: instance property of <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>  
**Access:** protected  
<a name="JobExecutor+manager"></a>

### *jobExecutor.manager : <code>[HubManager](HubManager.md#HubManager)</code>*
**Kind**: instance property of <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>  
**Access:** protected  
<a name="JobExecutor+add"></a>

### **jobExecutor.add(trackedJob)**
Add a tracked job to be run.

**Kind**: instance abstract method of <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](TrackedJob.md#TrackedJob)</code> | 

<a name="JobExecutor+getStatus"></a>

### **jobExecutor.getStatus() ⇒ <code>object</code>**
Get detail about queued and running jobs.

**Kind**: instance abstract method of <code>[JobExecutor](JobExecutor.md#JobExecutor)</code>  
