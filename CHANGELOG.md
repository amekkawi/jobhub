0.2.0 / 2016-09-13
==================

  * __\[BREAKING]__ Change success/failure jobConfig callbacks to be consistent/flexible:
    * Rename jobConfig's onResolve to onSuccess.
    * Rename jobConfig's onReject to onFailure.
    * Add TrackedJob instance as second argument of jobConfig's onProgress.
    * Change second argument of jobConfig's onSuccess/onFailure to be TrackedJob instance.
  * Add TrackedJob#progress prop which is updated before progress callbacks
  * Add tests for checking "stage" value before validation and quick run
  * Add missing tests for onProgress/onSuccess/onFailure
  * Improve JSDoc for jobConfig callbacks
  * Fix jobConfig.onProgress not called if quickRun sends progress

0.1.2 / 2016-09-06
==================

  * Add optional "meta" prop to JobConfig
  * Fix missing @throws to HubManager#queueJob
  * Fix queueForTermination not marked as protected

0.1.1 / 2016-09-01
==================

  * Add missing package.json props

0.1.0 / 2016-09-01
==================

  * Initial release
