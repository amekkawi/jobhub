# jobhub Change Log #

## 2.0.1 (January 4, 2017)

* Fix "Middleware" misspelled in method names ([#6](https://github.com/amekkawi/jobhub/issues/6))
   * Fix HubManager#addSyncMiddleware misspelled as addSyncMiddlware
   * Fix MiddlewareStore#addSyncMiddleware misspelled as addSyncMiddlware
   * Fix MiddlewareStore#addAsyncMiddleware misspelled as addAsyncMiddlware
   * Fix MiddlewareStore#removeSyncMiddleware misspelled as removeSyncMiddlware
   * Fix MiddlewareStore#removeAsyncMiddleware misspelled as removeAsyncMiddlware
* Fix syntax errors in middleware JSDoc examples

## 2.0.0 (December 4, 2016)

### Major changes

* __Added support for aborting jobs.__ Call [TrackedJob#abort](docs/api-protected/TrackedJob.md#TrackedJob+abort) method to abort a running job, which will
  abort the job [if possible](docs/api-protected/TrackedJob.md#TrackedJob+abort) and reject the job with a
  [JobAbortedError](docs/api-protected/JobAbortedError.md#JobAbortedError). A job's worker process is notified so that it can gracefully abort and cleanup. (#4)
* __Added support for controlling concurrently running jobs.__ Adds a base [JobExecutor](docs/api-protected/JobExecutor.md#JobExecutor) class for custom
  logic, but also includes a built-in implementation ([JobExecutorBuiltin](docs/api-protected/JobExecutorBuiltin.md#JobExecutorBuiltin)) that optionally limits the
  maximum number of concurrently running jobs. (#5)

### Breaking changes

* Changed [JobWorkerMediator#started](docs/api-protected/JobWorkerMediator.md#JobWorkerMediator+started) to only set to true once the startup confirmation is received. (from #4)
* Changed [HubManager#queueJob](docs/api-protected/HubManager.md#HubManager+queueJob) to add created TrackedJob instances to [HubManager#jobExecutor](docs/api-protected/HubManager.md#HubManager+jobExecutor)
  and no longer call [TrackedJob#run](docs/api-protected/TrackedJob.md#TrackedJob+run). As a result, TrackedJob will be in a pre-run state directly after
  [HubManager#queueJob](docs/api-protected/HubManager.md#HubManager+queueJob). (from #5)

### Breaking changes only if extending jobhub classes

* Added abstract [JobWorkerMediator#sendAbortMessage](docs/api-protected/JobWorkerMediator.md#JobWorkerMediator+sendAbortMessage) method. (from #4)
* Renamed JobWorkerIPC#attachIPCChecks to [attachToIPC](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+attachToIPC).
* Renamed JobWorkerIPC#detatchIPCChecks to [detatchFromIPC](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+detatchFromIPC).

### Notable non-breaking changes

* Added [JobWorkerMediator#forked](docs/api-protected/JobWorkerMediator.md#JobWorkerMediator+forked) which is set to true on child process fork,
  replacing the previous behavior of [JobWorkerMediator#started](docs/api-protected/JobWorkerMediator.md#JobWorkerMediator+started). (from #4)
* Added [TrackedJob#isSettled](docs/api-protected/TrackedJob.md#TrackedJob+isSettled) to determine if a job succeeded or failed.
* Added 6th argument to [workerBuildJobArg](docs/api-protected/middleware.md#workerBuildJobArg) middleware to add abort listener. (from #4)
* Added [HubManager#jobExecutor](docs/api-protected/HubManager.md#HubManager+jobExecutor) member property which is an instance of a JobExecutor abstract class.
  TrackedJob instances are added to JobExecutor which is then responsible for calling [TrackedJob#run](docs/api-protected/TrackedJob.md#TrackedJob+run). (from #5)
* Added [jobExecutorClass](docs/api-protected/HubManagerOptions.md#HubManagerOptions+jobExecutorClass) and
  [jobExecutorOptions](docs/api-protected/HubManagerOptions.md#HubManagerOptions+jobExecutorOptions) options to HubManager options
  to specify the constructor to use for
  [HubManager#jobExecutor](docs/api-protected/HubManager.md#HubManager+jobExecutor) and the options to pass to the instance.
* Changed [TrackedJob#then](docs/api-protected/TrackedJob.md#TrackedJob+then)/[catch](docs/api-protected/TrackedJob.md#TrackedJob+catch) to work before [TrackedJob#run](docs/api-protected/TrackedJob.md#TrackedJob+run) is called.
  Previously they would return a rejected Promise before the job was run.

### Documentation changes

* Added jsdoc for [workerLoadJob](docs/api-protected/middleware.md#workerLoadJob) and [workerBuildJobArg](docs/api-protected/middleware.md#workerBuildJobArg) middleware.

## 1.1.0 (November 23, 2016)

  * Add [TrackedJob#result](docs/api-protected/TrackedJob.md#TrackedJob+result) that is set to the result on job success
  * Add [TrackedJob#error](docs/api-protected/TrackedJob.md#TrackedJob+error) that is set to the result on job error
  * Change JobWorker to extend from EventEmitter
  * Change JobWorkerIPC to listen for IPC messages
    * Re-emit to JobWorker as `ipc-message::<message.type>`
    * Add [JobWorkerIPC#handleIPCDisconnect](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+handleIPCDisconnect) protected method
    * Add [JobWorkerIPC#handleIPCMessage](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+handleIPCMessage) protected method
  * Change JobWorkerIPC to move calls to protected methods to [JobWorkerIPC#init](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+init)
  * Fix [JobWorkerIPC#requestIPCPayload](docs/api-protected/JobWorkerIPC.md#JobWorkerIPC+requestIPCPayload) not clearing timeout
  * Fix calling next in quickRun should not start "run" stage synchronously

## 1.0.1 (November 16, 2016)

  * Fix TrackedJob#jobStarted emitted synchronously ([#3](https://github.com/amekkawi/jobhub/issues/3))

## 1.0.0 (November 14, 2016

  * Initial release
