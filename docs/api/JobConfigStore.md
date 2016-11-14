# [jobhub API](README.md): Class:

<a name="JobConfigStore"></a>

## JobConfigStore
Manages registered job config.

**Kind**: global class  

* [JobConfigStore](JobConfigStore.md#JobConfigStore)
    * [.registerJob(jobName, jobConfig)](JobConfigStore.md#JobConfigStore+registerJob) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.registerJobs(jobConfigMap)](JobConfigStore.md#JobConfigStore+registerJobs) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.unregisterJob(jobName)](JobConfigStore.md#JobConfigStore+unregisterJob) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.unregisterAllJobs()](JobConfigStore.md#JobConfigStore+unregisterAllJobs) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
    * [.getRegisteredJobNames()](JobConfigStore.md#JobConfigStore+getRegisteredJobNames) ⇒ <code>Array.&lt;string&gt;</code>
    * [.getJobConfig(jobName)](JobConfigStore.md#JobConfigStore+getJobConfig) ⇒ <code>[JobConfig](JobConfig.md#JobConfig)</code> &#124; <code>null</code>

<a name="JobConfigStore+registerJob"></a>

### jobConfigStore.registerJob(jobName, jobConfig) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
Register a job.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  
**Throws**:

- <code>[JobAlreadyExistsError](JobAlreadyExistsError.md#JobAlreadyExistsError)</code> 
- <code>[InvalidJobConfigError](InvalidJobConfigError.md#InvalidJobConfigError)</code> 


| Param | Type |
| --- | --- |
| jobName | <code>string</code> | 
| jobConfig | <code>[JobConfig](JobConfig.md#JobConfig)</code> &#124; <code>function</code> | 

<a name="JobConfigStore+registerJobs"></a>

### jobConfigStore.registerJobs(jobConfigMap) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
Register multiple jobs.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  
**Throws**:

- <code>[JobAlreadyExistsError](JobAlreadyExistsError.md#JobAlreadyExistsError)</code> 
- <code>[InvalidJobConfigError](InvalidJobConfigError.md#InvalidJobConfigError)</code> 


| Param | Type |
| --- | --- |
| jobConfigMap | <code>object.&lt;string, (function()\|JobConfig)&gt;</code> | 

<a name="JobConfigStore+unregisterJob"></a>

### jobConfigStore.unregisterJob(jobName) ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
Unregister a job by name.

Does not throw an error if a job by that name is not registered.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  

| Param | Type |
| --- | --- |
| jobName | <code>string</code> | 

<a name="JobConfigStore+unregisterAllJobs"></a>

### jobConfigStore.unregisterAllJobs() ⇒ <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>
Unregister all jobs.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  
<a name="JobConfigStore+getRegisteredJobNames"></a>

### jobConfigStore.getRegisteredJobNames() ⇒ <code>Array.&lt;string&gt;</code>
Get the names of jobs that have been registered.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  
<a name="JobConfigStore+getJobConfig"></a>

### jobConfigStore.getJobConfig(jobName) ⇒ <code>[JobConfig](JobConfig.md#JobConfig)</code> &#124; <code>null</code>
Get the normalized config for a job, or null if the job is not registered.

**Kind**: instance method of <code>[JobConfigStore](JobConfigStore.md#JobConfigStore)</code>  

| Param | Type |
| --- | --- |
| jobName | <code>string</code> | 

