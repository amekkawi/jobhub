<a name="module_jobhub/lib/worker"></a>

## jobhub/lib/worker
Built-in node script for running job worker child processes.

**Access:** protected  

* [jobhub/lib/worker](module_jobhub_lib_worker.md#module_jobhub/lib/worker)
    * [.main(jobWorker)](module_jobhub_lib_worker.md#module_jobhub/lib/worker.main)
    * [.cliFactory(argv)](module_jobhub_lib_worker.md#module_jobhub/lib/worker.cliFactory) ⇒ <code>[JobWorker](JobWorker.md#JobWorker)</code>

<a name="module_jobhub/lib/worker.main"></a>

### jobhub/lib/worker.main(jobWorker)
Start a CLI worker with the specified CLI arguments.

**Kind**: static method of <code>[jobhub/lib/worker](module_jobhub_lib_worker.md#module_jobhub/lib/worker)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| jobWorker | <code>[JobWorker](JobWorker.md#JobWorker)</code> | 

<a name="module_jobhub/lib/worker.cliFactory"></a>

### jobhub/lib/worker.cliFactory(argv) ⇒ <code>[JobWorker](JobWorker.md#JobWorker)</code>
Create an instance of JobWorker.

**Kind**: static method of <code>[jobhub/lib/worker](module_jobhub_lib_worker.md#module_jobhub/lib/worker)</code>  
**Access:** protected  

| Param | Type |
| --- | --- |
| argv | <code>Array.&lt;string&gt;</code> | 

