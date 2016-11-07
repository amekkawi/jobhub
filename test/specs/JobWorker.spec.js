var inherits = require('util').inherits;
var path = require('path');
var expect = require('expect');
var errors = require('../../lib/errors');
var constants = require('../../lib/constants');
var util = require('../../lib/util');
var JobWorker = require('../../lib/JobWorker');
var MiddlewareStore = require('../../lib/MiddlewareStore');
var JobConfigStore = require('../../lib/JobConfigStore');

describe('JobWorker', function() {
	it('should set properties', function() {
		var expecteParams = {};
		var expectedOptions = {};
		var worker = new JobWorker('foo', 'bar', expecteParams, expectedOptions);

		expect(worker.jobId).toBe('foo');
		expect(worker.jobName).toBe('bar');
		expect(worker.params).toBe(expecteParams);
		expect(worker.options).toBe(expectedOptions);
		expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
		expect(worker.jobs).toBeA(JobConfigStore);
		expect(worker.promise).toBe(null);

		expect(worker.middleware).toBeA(MiddlewareStore, 'Expected JobWorker#middleware %s to be a %s');
		expect(worker.middleware.getSupportedSyncTypes()).toEqual(worker.getSupportedSyncMiddleware(), 'Expected supported sync middleware %s to equal %s');
		expect(worker.middleware.hasSyncSupport(constants.MIDDLEWARE_WORKER_LOAD_JOB)).toBe(true, 'Expected middleware support for "workerLoadJob"');
		expect(worker.middleware.hasSyncSupport(constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG)).toBe(true, 'Expected middleware support for "workerBuildJobArg"');
		expect(worker.jobs).toBeA(JobConfigStore, 'Expected JobWorker#jobs %s to be a %s');
	});

	it('should allow overriding built-in supported middleware', function() {
		function ExtWorker() {
			JobWorker.apply(this, arguments);
		}

		inherits(ExtWorker, JobWorker);

		ExtWorker.prototype.getSupportedSyncMiddleware = function() {
			return [ 'FOO' ];
		};

		var worker = new ExtWorker('foo', 'bar', {}, {});
		expect(worker.middleware.getSupportedSyncTypes()).toEqual(['FOO']);
	});

	describe('JobWorker#init', function() {
		it('should reject with InvalidManagerOptionsError if missing jobsModulePath', function() {
			var worker = new JobWorker('foo', 'bar', {}, {});
			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				expect(err).toBeA(errors.InvalidManagerOptionsError);
				expect(err.propName).toBe('jobsModulePath');
			});
		});

		it('should optionally require options.initModulePath and call initWorker', function() {
			var expectedError = new Error();
			var initModulePath = path.join(__dirname, '../fixtures/init-module.js');

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js'),
				initModulePath: initModulePath
			});

			expect.spyOn(worker, 'loadJob').andThrow(expectedError);

			var initModule = require(initModulePath);
			expect(initModule.initWorker.calls.length).toBe(0);

			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.loadJob.calls.length).toBe(1);
				expect(initModule.initWorker.calls.length).toBe(1);
				expect(initModule.initWorker.calls[0].arguments.length).toBe(1);
				expect(initModule.initWorker.calls[0].arguments[0]).toBe(worker);
			});
		});

		it('should catch error thrown by initWorker', function() {
			var initModulePath = path.join(__dirname, '../fixtures/init-module-throw.js');

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js'),
				initModulePath: initModulePath
			});

			expect.spyOn(worker, 'loadJob');

			var initModule = require(initModulePath);
			expect(initModule.initWorker.calls.length).toBe(0);

			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== initModule.initWorker.expectedError) {
					throw err;
				}

				expect(worker.loadJob.calls.length).toBe(0);
				expect(initModule.initWorker.calls.length).toBe(1);
			});
		});

		it('should support Promise returned by initWorker', function() {
			var initModulePath = path.join(__dirname, '../fixtures/init-module-throw-promise.js');

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js'),
				initModulePath: initModulePath
			});

			expect.spyOn(worker, 'loadJob');

			var initModule = require(initModulePath);
			expect(initModule.initWorker.calls.length).toBe(0);

			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== initModule.initWorker.expectedError) {
					throw err;
				}

				expect(worker.loadJob.calls.length).toBe(0);
				expect(initModule.initWorker.calls.length).toBe(1);
			});
		});

		it('should catch error thrown by JobWorker#loadJob', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'loadJob').andThrow(expectedError);

			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.loadJob.calls.length).toBe(1);
			});
		});

		it('should support Promise returned by JobWorker#loadJob', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'loadJob').andCall(function() {
				return Promise.reject(expectedError);
			});

			return worker.init().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.loadJob.calls.length).toBe(1);
			});
		});
	});

	describe('JobWorker#loadJob', function() {
		it('should load jobs from options.jobsModulePath', function() {
			var jobsModulePath = path.join(__dirname, '../fixtures/jobs.js');
			var jobsModule = require(jobsModulePath);

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: jobsModulePath
			});

			expect.spyOn(worker.jobs, 'registerJobs').andReturn(500);

			var promise = worker.loadJob();

			expect(promise).toBeA(Promise);
			expect(worker.jobs.registerJobs.calls.length).toBe(1);
			expect(worker.jobs.registerJobs.calls[0].arguments.length).toBe(1);
			expect(worker.jobs.registerJobs.calls[0].arguments[0]).toBe(jobsModule);

			return promise.then(function(result) {
				expect(worker.jobs.registerJobs.calls.length).toBe(1);
				expect(result).toBe(void 0);
			});
		});

		it('should support "workerLoadJob" middleware', function() {
			var jobsModulePath = path.join(__dirname, '../fixtures/jobs.js');
			var jobsModule = require(jobsModulePath);
			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: jobsModulePath
			});

			expect.spyOn(worker.jobs, 'registerJobs').andCall(function() {
				expect(spyWorkerLoadJob.calls.length).toBe(1);
			});

			var spyWorkerLoadJob = expect.createSpy().andCall(function() {
				expect(worker.jobs.registerJobs.calls.length).toBe(0);

				expect(this).toBe(worker);
				expect(arguments.length).toBe(3);
				expect(arguments[0]).toBe(worker.jobs);
				expect(arguments[1]).toBe(worker.jobName);
				expect(arguments[2]).toBeA(Function);

				var nextRet = arguments[2]();
				expect(nextRet).toBe(void 0);
				expect(worker.jobs.registerJobs.calls.length).toBe(1);
				expect(worker.jobs.registerJobs.calls[0].arguments.length).toBe(1);
				expect(worker.jobs.registerJobs.calls[0].arguments[0]).toBe(jobsModule);
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				spyWorkerLoadJob
			);

			var promise = worker.loadJob();

			expect(promise).toBeA(Promise);
			expect(spyWorkerLoadJob.calls.length).toBe(1);

			return promise.then(function(result) {
				expect(spyWorkerLoadJob.calls.length).toBe(1);
				expect(worker.jobs.registerJobs.calls.length).toBe(1);
				expect(result).toBe(void 0);
			});
		});

		it('should catch errors thrown by "workerLoadJob" middleware', function() {
			var expectedError = new Error();
			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker.jobs, 'registerJobs');

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function() {
					throw expectedError;
				}
			);

			var promise = worker.loadJob();

			expect(promise).toBeA(Promise);
			expect(worker.jobs.registerJobs.calls.length).toBe(0);

			return promise.then(function() {

			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.jobs.registerJobs.calls.length).toBe(0);
			});
		});
	});

	describe('JobWorker#buildJobArg', function() {
		it('should return an object with expected props', function() {
			var expectedParams = {};
			var expectedProgress = {};
			var expectedResolve = function() {};
			var expectedReject = function() {};
			var expectedCallback = function() {};

			var worker = new JobWorker('foo', 'bar', expectedParams, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'handleProgress').andCallThrough();

			var jobArg = worker.buildJobArg(expectedResolve, expectedReject);
			expect(jobArg).toBeA(Object, 'Expected return value %s to be a object');
			expect(Object.keys(jobArg).length).toBe(5, 'Expected return value key count %s to be %s');
			expect(jobArg.jobId).toBe('foo', 'Expected return value prop jobId %s to be %s');
			expect(jobArg.params).toBe(expectedParams, 'Expected return value prop params %s to be %s');
			expect(jobArg.resolve).toBe(expectedResolve, 'Expected return value prop resolve %s to be %s');
			expect(jobArg.reject).toBe(expectedReject, 'Expected return value prop reject %s to be %s');
			expect(jobArg.sendProgress).toBeA(Function, 'Expected return value prop sendProgress %s to be a function');

			expect(worker.handleProgress.calls.length).toBe(0);
			var progressRet = jobArg.sendProgress(expectedProgress);
			expect(progressRet).toBeA(Promise);
			expect(worker.handleProgress.calls.length).toBe(1);
			expect(worker.handleProgress.calls[0].context).toBe(worker);
			expect(worker.handleProgress.calls[0].arguments.length).toBe(1);
			expect(worker.handleProgress.calls[0].arguments[0]).toBe(expectedProgress);
		});

		it('should support "workerBuildJobArg" middleware', function() {
			var expectedRet = {};
			var expectedParams = {};
			var expectedProgress = {};
			var expectedResolve = function() {};
			var expectedReject = function() {};

			var worker = new JobWorker('foo', 'bar', expectedParams, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'handleProgress').andCallThrough();

			var spyWorkerBuildJobArg = expect.createSpy().andCall(function() {
				expect(this).toBe(worker);
				expect(arguments.length).toBe(6);
				expect(arguments[0]).toBe('foo');
				expect(arguments[1]).toBe(expectedParams);
				expect(arguments[2]).toBe(expectedResolve);
				expect(arguments[3]).toBe(expectedReject);
				expect(arguments[4]).toBeA(Function);
				expect(arguments[5]).toBeA(Function);

				expect(worker.handleProgress.calls.length).toBe(0);
				var progressRet = arguments[4](expectedProgress);
				expect(progressRet).toBeA(Promise);
				expect(worker.handleProgress.calls.length).toBe(1);
				expect(worker.handleProgress.calls[0].context).toBe(worker);
				expect(worker.handleProgress.calls[0].arguments.length).toBe(1);
				expect(worker.handleProgress.calls[0].arguments[0]).toBe(expectedProgress);

				var nextRet = arguments[5]();
				expect(nextRet).toBeA(Object, 'Expected next() return value %s to be a object');
				expect(Object.keys(nextRet).length).toBe(5, 'Expected next() return value key count %s to be %s');
				expect(nextRet.jobId).toBe('foo', 'Expected next().jobId %s to be %s');
				expect(nextRet.params).toBe(expectedParams, 'Expected next().params %s to be %s');
				expect(nextRet.resolve).toBe(expectedResolve, 'Expected next().resolve %s to be %s');
				expect(nextRet.reject).toBe(expectedReject, 'Expected next().reject %s to be %s');
				expect(nextRet.sendProgress).toBeA(Function, 'Expected next().sendProgress %s to be a function');

				return expectedRet;
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG,
				spyWorkerBuildJobArg
			);

			var jobArg = worker.buildJobArg(expectedResolve, expectedReject);
			expect(spyWorkerBuildJobArg.calls.length).toBe(1, 'Expected "workerBuildJobArg" middleware call count %s to be %s');
			expect(jobArg).toBe(expectedRet, 'Expected JobWorker#buildJobArg return value %s to be %s');
		});
	});

	describe('JobWorker#start', function() {
		it('should set JobWorker#running to true and set JobWorker#promise and call JobWorker#init asynchronously', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'init').andCall(function() {
				expect(this).toBe(worker);
				expect(arguments.length).toBe(0);
				expect(worker.running).toBe(true, 'Expected JobWorker#running %s to be %s');
				expect(worker.promise).toBeA(Promise);
				expect(worker.promise).toBe(promise);
				throw expectedError;
			});

			expect(worker.init.calls.length).toBe(0);
			expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');

			var promise = worker.start();

			expect(worker.running).toBe(true, 'Expected JobWorker#running %s to be %s');
			expect(worker.promise).toBeA(Promise);
			expect(worker.promise).toBe(promise);
			expect(worker.init.calls.length).toBe(0);

			return promise.then(function() {
				throw new Error('Expected not to resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.init.calls.length).toBe(1, 'Expected JobWorker#init call count %s to be %s');
				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
			});
		});

		it('should get job config after init and throw a JobNotFoundError if job is not registered', function() {
			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'init').andCallThrough();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function() {
					// Do not load jobs
				}
			);

			expect.spyOn(worker.jobs, 'getJobConfig').andCall(function() {
				expect(worker.running).toBe(true, 'Expected JobWorker#running %s to be %s');
				expect(worker.init.calls.length).toBe(1);
				return null;
			});

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
				expect(worker.init.calls.length).toBe(1);
				expect(worker.jobs.getJobConfig.calls.length).toBe(1);
				expect(err).toBeA(errors.JobNotFoundError);
				expect(err.jobName).toBe('bar');
			});
		});

		it('should validate params using JobConfig#validate and catch thrown errors', function() {
			var expectedError = new Error();
			var expectedParams = {};
			var jobConfig;

			var worker = new JobWorker('foo', 'bar', expectedParams, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyValidate = expect.createSpy().andCall(function() {
				expect(jobConfig.run.calls.length).toBe(0);
				expect(worker.jobs.getJobConfig.calls.length).toBe(1);

				expect(this).toBe(jobConfig);
				expect(arguments.length).toBe(2);
				expect(arguments[0]).toBe(expectedParams);
				expect(arguments[1]).toBe(errors.InvalidJobParamError);
				throw expectedError;
			});

			var spyRun = expect.createSpy();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						validate: spyValidate,
						run: spyRun
					});

					jobConfig = worker.jobs.getJobConfig('bar');

					// Add spy after getting the job config the first time
					expect.spyOn(worker.jobs, 'getJobConfig').andCallThrough();
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
				expect(spyValidate.calls.length).toBe(1);
				expect(spyRun.calls.length).toBe(0);
			});
		});

		it('should allow JobConfig#validate to return a Promise', function() {
			var expectedError = new Error();
			var expectedParams = {};

			var worker = new JobWorker('foo', 'bar', expectedParams, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyRun = expect.createSpy();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						validate: function() {
							return Promise.reject(expectedError);
						},
						run: spyRun
					});
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
				expect(spyRun.calls.length).toBe(0);
			});
		});

		it('should call JobWorker#buildJobArg and JobConfig#run', function() {
			var expectedParams = {};
			var expectedResult = {};
			var jobConfig;
			var jobArg;

			var worker = new JobWorker('foo', 'bar', expectedParams, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyBuildJobArg = expect.createSpy().andCall(function() {
				expect(spyRun.calls.length).toBe(0);
				return jobArg = arguments[5](); // Next
			});

			var spyRun = expect.createSpy().andCall(function() {
				expect(spyBuildJobArg.calls.length).toBe(1);
				expect(this).toBe(jobConfig);
				expect(arguments.length).toBe(1);
				expect(arguments[0]).toBe(jobArg);
				jobArg.resolve(expectedResult);
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: spyRun
					});

					jobConfig = worker.jobs.getJobConfig('bar');
				}
			);

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG,
				spyBuildJobArg
			);

			return worker.start().then(function(result) {
				expect(result).toBe(expectedResult);
				expect(spyBuildJobArg.calls.length).toBe(1);
				expect(spyRun.calls.length).toBe(1);
			});
		});

		it('should catch errors thrown by JobWorker#buildJobArg', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyRun = expect.createSpy();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: spyRun
					});
				}
			);

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_BUILD_JOB_ARG,
				function() {
					throw expectedError;
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(spyRun.calls.length).toBe(0);
			});
		});

		it('should catch errors thrown by JobConfig#run', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyRun = expect.createSpy().andCall(function() {
				throw expectedError;
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: spyRun
					});
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(spyRun.calls.length).toBe(1);
			});
		});

		it('should allow JobConfig#run to resolve', function() {
			var expectedResult = {};

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: function(job) {
							job.resolve(expectedResult);
						}
					});
				}
			);

			return worker.start().then(function(result) {
				expect(result).toBe(expectedResult);
			});
		});

		it('should allow JobConfig#run to reject', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyRun = expect.createSpy().andCall(function(job) {
				job.reject(expectedError);
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: spyRun
					});
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(spyRun.calls.length).toBe(1);
			});
		});

		it('should allow JobConfig#run to send progress', function() {
			var expectedProgressA = ['progressA'];
			var expectedProgressB = ['progressB'];
			var expectedResult = ['result'];

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'handleProgress').andCall(function() {
				expect(this).toBe(worker);
				expect(arguments.length).toBe(1);
				return Promise.resolve();
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: function(job) {
							var promiseA = job.sendProgress(expectedProgressA);
							var promiseB = job.sendProgress(expectedProgressB);
							expect(promiseA).toBeA(Promise);
							expect(promiseB).toBeA(Promise);
							job.resolve(expectedResult);
						}
					});
				}
			);

			return worker.start().then(function() {
				expect(worker.handleProgress.calls.length).toBe(2);
				expect(worker.handleProgress.calls[0].arguments[0]).toBe(expectedProgressA);
				expect(worker.handleProgress.calls[1].arguments[0]).toBe(expectedProgressB);
			});
		});

		it('should call JobWorker#handleSuccess', function() {
			var expectedResult = {};

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var spyHandleSuccessPromise = expect.createSpy().andCall(function() {
				expect(spyResolve.calls.length).toBe(0);
			});

			expect.spyOn(worker, 'handleError').andCallThrough();

			var handleSuccessOrig = worker.handleSuccess;
			expect.spyOn(worker, 'handleSuccess').andCall(function() {
				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
				expect(spyResolve.calls.length).toBe(0);
				expect(worker.handleError.calls.length).toBe(0);

				var origRet = handleSuccessOrig.apply(this, arguments);
				expect(origRet).toBeA(Promise);
				return origRet.then(spyHandleSuccessPromise);
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: function(job) {
							job.resolve(expectedResult);
						}
					});
				}
			);

			var spyResolve = expect.createSpy().andCall(function(result) {
				expect(result).toBe(expectedResult);
				expect(spyHandleSuccessPromise.calls.length).toBe(1);
				expect(worker.handleSuccess.calls.length).toBe(1);
				expect(worker.handleSuccess.calls[0].arguments.length).toBe(1);
				expect(worker.handleSuccess.calls[0].arguments[0]).toBe(expectedResult);
				expect(worker.handleError.calls.length).toBe(0);
			});

			return worker.start()
				.then(spyResolve);
		});

		it('should call JobWorker#handleError', function() {
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var promise = worker.start();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function() {
					throw expectedError;
				}
			);

			var spyHandleErrorPromise = expect.createSpy().andCall(function() {
				expect(spyCatch.calls.length).toBe(0);
			});

			expect.spyOn(worker, 'handleSuccess').andCallThrough();

			var handleErrorOrig = worker.handleError;
			expect.spyOn(worker, 'handleError').andCall(function() {
				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
				expect(spyCatch.calls.length).toBe(0);
				expect(worker.handleSuccess.calls.length).toBe(0);

				var origRet = handleErrorOrig.apply(this, arguments);
				expect(origRet).toBeA(Promise);
				return Promise.resolve()
					.then(spyHandleErrorPromise);
			});

			var spyCatch = expect.createSpy().andCall(function(err) {
				if (err !== expectedError) {
					throw err;
				}

				expect(spyHandleErrorPromise.calls.length).toBe(1);
				expect(worker.handleSuccess.calls.length).toBe(0, 'Expected JobWorker#handleSuccess call count %s to be %s');
				expect(worker.handleError.calls.length).toBe(1, 'Expected JobWorker#handleError call count %s to be %s');
				expect(worker.handleError.calls[0].arguments.length).toBe(1, 'Expected JobWorker#handleError arguments length %s to be %s');
				expect(worker.handleError.calls[0].arguments[0]).toBe(expectedError, 'Expected JobWorker#handleError arguments[0] %s to be %s');
				expect(worker.running).toBe(false, 'Expected JobWorker#running %s to be %s');
			});

			return promise.then(function() {
				throw new Error('Expected not to resolve');
			}, spyCatch);
		});

		it('should handle a rejected Promise returned by JobWorker#handleSuccess and rethrow as JobWorkerHandlerError', function() {
			var expectedResult = {};
			var expectedError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			expect.spyOn(worker, 'handleError').andCallThrough();
			expect.spyOn(worker, 'handleSuccess').andCall(function() {
				return Promise.reject(expectedError);
			});

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function(jobStore, jobName) {
					jobStore.registerJob(jobName, {
						run: function(job) {
							job.resolve(expectedResult);
						}
					});
				}
			);

			return worker.start().then(function() {
				throw new Error('Expected to not resolve');
			}, function(err) {
				if (!(err instanceof errors.JobWorkerHandlerError)) {
					throw err;
				}

				expect(err.type).toBe(errors.JobWorkerHandlerError.TYPES.SUCCESS, 'Expected prop "type" %s to be %s');
				expect(err.original).toBe(expectedResult, 'Expected prop "original" %s to be %s');
				expect(err.error).toBe(expectedError, 'Expected prop "error" %s to be %s');
			});
		});

		it('should handle a rejected Promise returned by JobWorker#handleError and rethrow as JobWorkerHandlerError', function() {
			var expectedOrigError = new Error();
			var expectedHandlerError = new Error();

			var worker = new JobWorker('foo', 'bar', {}, {
				jobsModulePath: path.join(__dirname, '../fixtures/jobs.js')
			});

			var promise = worker.start();

			worker.middleware.addSyncMiddlware(
				constants.MIDDLEWARE_WORKER_LOAD_JOB,
				function() {
					throw expectedOrigError;
				}
			);

			expect.spyOn(worker, 'handleError').andCall(function() {
				return Promise.reject(expectedHandlerError);
			});

			return promise.then(function() {
				throw new Error('Expected not to resolve');
			}, function(err) {
				if (!(err instanceof errors.JobWorkerHandlerError)) {
					throw err;
				}

				expect(err.type).toBe(errors.JobWorkerHandlerError.TYPES.ERROR, 'Expected prop "type" %s to be %s');
				expect(err.original).toBe(expectedOrigError, 'Expected prop "original" %s to be %s');
				expect(err.error).toBe(expectedHandlerError, 'Expected prop "error" %s to be %s');
			});
		});
	});
});
