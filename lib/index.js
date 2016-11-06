exports.HubManager = require('./HubManager');
exports.errors = require('./errors');
exports.constants = require('./constants');

/**
 * @typedef {object} JobConfig_JobArg
 * @property {string} jobId
 * @property {*} params
 * @property {function} resolve - Call with an optional single argument to resolve the job
 * @property {function} reject - Call with a single Error argument to reject the job
 * @property {JobConfig_JobArg_sendProgress} sendProgress - Call with a single argument to send progress updates
 */

/**
 * @callback JobConfig_JobArg_sendProgress
 * @param {*} progress
 * @returns {Promise} Resolves once the progress is sent, and rejects if there was an error sending the progress
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
 * @callback JobConfig_onCreate
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
 * @property {JobConfig_onCreate} [onCreate=null]
 * @property {object} [meta={}]
 */
