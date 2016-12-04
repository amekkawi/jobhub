# jobhub Change Log #

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
