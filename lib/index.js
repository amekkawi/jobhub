exports.HubManager = require('./HubManager');
exports.errors = require('./errors');
exports.constants = require('./constants');

/**
 * @typedef {object} JobConfig_JobArg
 * @property {string} jobId
 * @property {*} params
 * @property {function} resolve - Call with an optional single argument to resolve the job
 * @property {function} reject - Call with a single Error argument to reject the job
 * @property {function} sendProgress - Call with a single argument to send progress updates
 */

/**
 * @callback JobConfig_quickRun
 * @param {JobConfig_JobArg} job
 * @param {function} next - Call to skip "quickRun", continuing to "run" the worker
 */

/**
 * @callback JobConfig_run
 * @param {JobConfig_JobArg} job
 */

/**
 * @callback JobConfig_uniqueKey
 * @param {*} params
 */

/**
 * @callback JobConfig_validate
 * @param {*} params
 * @param {InvalidJobParamError} InvalidJobParamError - Error constructor that should be used to throw validation errors
 */

/**
 * @callback JobConfig_onSuccess
 * @param {*} result
 * @param {TrackedJob} trackedJob
 */

/**
 * @callback JobConfig_onFailure
 * @param {Error} err
 * @param {TrackedJob} trackedJob
 */

/**
 * @callback JobConfig_onProgress
 * @param {*} progress
 * @param {TrackedJob} trackedJob
 */

/**
 * @typedef {object} JobConfig
 * @property {string} jobName
 * @property {JobConfig_run} run
 * @property {JobConfig_quickRun} [quickRun=null]
 * @property {boolean} [unique=false]
 * @property {JobConfig_uniqueKey} [uniqueKey=null]
 * @property {JobConfig_validate} [validate=null]
 * @property {JobConfig_onSuccess} [onSuccess=null]
 * @property {JobConfig_onFailure} [onFailure=null]
 * @property {JobConfig_onProgress} [onProgress=null]
 * @property {object} [meta={}]
 */
