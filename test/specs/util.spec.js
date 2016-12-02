var path = require('path');
var util = require('../../lib/util');
var expect = require('expect');
var constants = require('../../lib/constants');
var errors = require('../../lib/errors');

describe('util', function() {
	var exportNames = [
		'dehydrateError',
		'extendDefaultOptions',
		'getDefaultManagerOptions',
		'getUniqueKey',
		'objectValues',
		'onlyOneCallback',
		'parseJobConfig',
		'parseManagerOptions',
		'promiseTry',
		'rejectOnThrow',
		'validateJobParams'
	].sort();

	it('should export correct names', function() {
		expect(Object.keys(util).sort())
			.toEqual(exportNames);
	});

	var managerOptions = [
		'forkModulePath',
		'jobsModulePath',
		'jobExecutorClass',
		'jobExecutorOptions',
		'initModulePath',
		'terminationSIGTERMTimeout',
		'terminationSIGKILLTimeout',
		'workerStartupTimeout',
		'createId'
	].sort();

	describe('getDefaultManagerOptions', function() {
		it('should return the correct keys', function() {
			expect(Object.keys(util.getDefaultManagerOptions()).sort()).toEqual(managerOptions);
		});

		it('should have "forkModulePath" point to worker buitin worker', function() {
			expect(util.getDefaultManagerOptions().forkModulePath)
				.toBe(path.resolve(__dirname, '..', '..', 'lib', 'worker.js'));
		});

		it('should have "jobsModulePath" default to null', function() {
			expect(util.getDefaultManagerOptions().jobsModulePath).toBe(null);
		});

		it('should have "jobExecutorClass" default to null', function() {
			expect(util.getDefaultManagerOptions().jobExecutorClass).toBe(null);
		});

		it('should have "jobExecutorOptions" default to null', function() {
			expect(util.getDefaultManagerOptions().jobExecutorOptions).toBe(null);
		});

		it('should have "terminationSIGTERMTimeout" default to 60000', function() {
			expect(util.getDefaultManagerOptions().terminationSIGTERMTimeout).toBe(60000);
		});

		it('should have "terminationSIGKILLTimeout" default to 60000', function() {
			expect(util.getDefaultManagerOptions().terminationSIGKILLTimeout).toBe(60000);
		});

		it('should have "workerStartupTimeout" default to 20000', function() {
			expect(util.getDefaultManagerOptions().workerStartupTimeout).toBe(20000);
		});

		it('should have "createId" default to uuid\'s v4 method', function() {
			expect(util.getDefaultManagerOptions().createId).toBe(require('uuid').v4);
		});
	});

	describe('parseManagerOptions', function() {
		it('should normalize the props', function() {
			var defaultOptions = util.getDefaultManagerOptions();
			var parsed = util.parseManagerOptions({
				jobsModulePath: 'path/to/worker.js'
			}, defaultOptions);
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed).sort()).toEqual(managerOptions);
			expect(parsed.jobsModulePath).toBe('path/to/worker.js');
			expect(parsed.forkModulePath).toBe(defaultOptions.forkModulePath);
			expect(parsed.initModulePath).toBe(defaultOptions.initModulePath);
		});

		it('should omit props not in the defaults', function() {
			var parsed = util.parseManagerOptions({
				jobsModulePath: 'path/to/worker.js',
				someOtherProp: {}
			}, util.getDefaultManagerOptions());
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed).sort()).toEqual(managerOptions);
		});

		it('should throw a InvalidManagerOptionsError if "jobsModulePath" is not a string', function() {
			expect(function() {
				util.parseManagerOptions({}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobsModulePath'
			});
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: null
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobsModulePath'
			});
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: {}
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobsModulePath'
			});
		});

		it('should throw a InvalidManagerOptionsError if "forkModulePath" is not a string', function() {
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: 'path/to/module',
					forkModulePath: null
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'forkModulePath'
			});
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: 'path/to/module',
					forkModulePath: {}
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'forkModulePath'
			});
		});

		it('should throw a InvalidManagerOptionsError if "initModulePath" is not a string', function() {
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: 'path/to/module',
					initModulePath: {}
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'initModulePath'
			});
		});

		it('should throw a InvalidManagerOptionsError if "jobExecutorClass" is not a function', function() {
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: 'path/to/module',
					jobExecutorClass: {}
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorClass'
			});
		});

		it('should throw a InvalidManagerOptionsError if "jobExecutorOptions" is not a function', function() {
			expect(function() {
				util.parseManagerOptions({
					jobsModulePath: 'path/to/module',
					jobExecutorOptions: 500
				}, util.getDefaultManagerOptions());
			}).toThrowWithProps(errors.InvalidManagerOptionsError, {
				propName: 'jobExecutorOptions'
			});
		});

		it('should throw a InvalidManagerOptionsError if "terminationSIGTERMTimeout" is not a number or less than 0', function() {
			[function(){}, -1, void 0, null, '0', '1', Infinity, NaN, -Infinity, true, false, [], {}].forEach(function(val) {
				expect(function() {
					util.parseManagerOptions({
						jobsModulePath: 'path/to/module',
						terminationSIGTERMTimeout: val
					}, util.getDefaultManagerOptions());
				}).toThrowWithProps(errors.InvalidManagerOptionsError, {
					propName: 'terminationSIGTERMTimeout'
				});
			});
		});

		it('should throw a InvalidManagerOptionsError if "terminationSIGKILLTimeout" is not a number or less than 0', function() {
			[function(){}, -1, void 0, null, '0', '1', Infinity, NaN, -Infinity, true, false, [], {}].forEach(function(val) {
				expect(function() {
					util.parseManagerOptions({
						jobsModulePath: 'path/to/module',
						terminationSIGKILLTimeout: val
					}, util.getDefaultManagerOptions());
				}).toThrowWithProps(errors.InvalidManagerOptionsError, {
					propName: 'terminationSIGKILLTimeout'
				});
			});
		});

		it('should throw a InvalidManagerOptionsError if "workerStartupTimeout" is not a number or less than 0', function() {
			[function(){}, -1, void 0, null, '0', '1', Infinity, NaN, -Infinity, true, false, [], {}].forEach(function(val) {
				expect(function() {
					util.parseManagerOptions({
						jobsModulePath: 'path/to/module',
						workerStartupTimeout: val
					}, util.getDefaultManagerOptions());
				}).toThrowWithProps(errors.InvalidManagerOptionsError, {
					propName: 'workerStartupTimeout'
				});
			});
		});

		it('should throw a InvalidManagerOptionsError if "createId" is not a function', function() {
			[0, 1, -1, void 0, null, '0', '1', Infinity, NaN, -Infinity, true, false, [], {}].forEach(function(val) {
				expect(function() {
					util.parseManagerOptions({
						jobsModulePath: 'path/to/module',
						createId: val
					}, util.getDefaultManagerOptions());
				}).toThrowWithProps(errors.InvalidManagerOptionsError, {
					propName: 'createId'
				});
			});
		});
	});

	describe('parseJobConfig', function() {
		var props = [
			'jobName',
			'run',
			'quickRun',
			'unique',
			'uniqueKey',
			'validate',
			'onCreate',
			'meta'
		].sort();

		it('should normalize the props', function() {
			var jobConfig = {
				run: function() {},
				quickRun: function() {},
				unique: false,
				uniqueKey: function() {},
				validate: function() {},
				onCreate: function() {},
				meta: {}
			};
			var parsed = util.parseJobConfig('FOO', jobConfig);
			expect(parsed).toBeA(Object);
			expect(Object.keys(parsed).sort()).toEqual(props);
			expect(parsed.jobName).toBe('FOO');
			expect(parsed.run).toBe(jobConfig.run);
			expect(parsed.quickRun).toBe(jobConfig.quickRun);
			expect(parsed.unique).toBe(true);
			expect(parsed.uniqueKey).toBe(jobConfig.uniqueKey);
			expect(parsed.validate).toBe(jobConfig.validate);
			expect(parsed.onCreate).toBe(jobConfig.onCreate);
			expect(parsed.meta).toBe(jobConfig.meta);
		});

		it('should only require "run"', function() {
			var jobConfig = {
				run: function() {}
			};
			var parsed = util.parseJobConfig('FOO', jobConfig);
			expect(parsed).toBeA(Object);
			expect(Object.keys(parsed).sort()).toEqual(props);
			expect(parsed.jobName).toBe('FOO');
			expect(parsed.run).toBe(jobConfig.run);
			expect(parsed.quickRun).toBe(null);
			expect(parsed.unique).toBe(false);
			expect(parsed.uniqueKey).toBe(null);
			expect(parsed.validate).toBe(null);
			expect(parsed.onCreate).toBe(null);
			expect(parsed.meta).toBeA(Object);
			expect(parsed.meta).toEqual({});
		});

		it('should coerce "unique" to a boolean', function() {
			expect(util.parseJobConfig('FOO', {
				run: function() {},
				unique: {}
			}).unique).toBe(true);
			expect(util.parseJobConfig('FOO', {
				run: function() {},
				unique: 0
			}).unique).toBe(false);
		});

		it('should set "unique" to true if "uniqueKey" is set', function() {
			var jobConfig = {
				run: function() {},
				uniqueKey: function() {}
			};
			var parsed = util.parseJobConfig('FOO', jobConfig);
			expect(parsed).toBeA(Object);
			expect(Object.keys(parsed).sort()).toEqual(props);
			expect(parsed.jobName).toBe('FOO');
			expect(parsed.run).toBe(jobConfig.run);
			expect(parsed.quickRun).toBe(null);
			expect(parsed.unique).toBe(true);
			expect(parsed.uniqueKey).toBe(jobConfig.uniqueKey);
			expect(parsed.validate).toBe(null);
		});

		it('should allow jobConfig to be a function', function() {
			var jobConfig = function() {};
			var parsed = util.parseJobConfig('FOO', jobConfig);
			expect(parsed).toBeA(Object);
			expect(Object.keys(parsed).sort()).toEqual(props);
			expect(parsed.jobName).toBe('FOO');
			expect(parsed.run).toBe(jobConfig);
			expect(parsed.quickRun).toBe(null);
			expect(parsed.unique).toBe(false);
			expect(parsed.uniqueKey).toBe(null);
			expect(parsed.validate).toBe(null);
			expect(parsed.onCreate).toBe(null);
			expect(parsed.meta).toBeA(Object);
			expect(parsed.meta).toEqual({});
		});

		it('should throw a InvalidJobConfigError if jobConfig is not a function or object', function() {
			expect(function() {
				util.parseJobConfig('FOO', null);
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: void 0
			});

			expect(function() {
				util.parseJobConfig('FOO', 5);
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: void 0
			});

			expect(function() {
				util.parseJobConfig('FOO', true);
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: void 0
			});
		});

		it('should throw a InvalidJobConfigError if "run" is not a function', function() {
			expect(function() {
				util.parseJobConfig('FOO', {});
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'run'
			});

			expect(function() {
				util.parseJobConfig('FOO', { run: {} });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'run'
			});
		});

		it('should throw a InvalidJobConfigError if "quickRun" is specified and not a function', function() {
			expect(function() {
				util.parseJobConfig('FOO', { run: function() {}, quickRun: {} });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'quickRun'
			});
		});

		it('should throw a InvalidJobConfigError if "uniqueKey" is specified and not a function', function() {
			expect(function() {
				util.parseJobConfig('FOO', { run: function() {}, uniqueKey: {} });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'uniqueKey'
			});
		});

		it('should throw a InvalidJobConfigError if "validate" is specified and not a function', function() {
			expect(function() {
				util.parseJobConfig('FOO', { run: function() {}, validate: {} });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'validate'
			});
		});

		it('should throw a InvalidJobConfigError if "onCreate" is specified and not a function', function() {
			expect(function() {
				util.parseJobConfig('FOO', { run: function() {}, onCreate: {} });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'onCreate'
			});
		});

		it('should throw a InvalidJobConfigError if "meta" is specified and not an object', function() {
			expect(function() {
				util.parseJobConfig('FOO', { run: function() {}, meta: 5 });
			}).toThrowWithProps(errors.InvalidJobConfigError, {
				jobName: 'FOO',
				propName: 'meta'
			});
		});
	});

	// describe('parseWorkerPayload', function() {
	// 	var props = ['jobsModulePath', 'initModulePath', 'params'].sort();
	//
	// 	it('should normalize the props', function() {
	// 		var payload = Object.freeze({
	// 			jobsModulePath: 'path/to/jobs',
	// 			initModulePath: 'path/to/init',
	// 			params: Object.freeze({})
	// 		});
	// 		var parsed = util.parseWorkerPayload(payload);
	// 		expect(parsed).toBeA(Object);
	// 		expect(Object.getOwnPropertyNames(parsed).sort()).toEqual(props);
	// 		expect(parsed.jobsModulePath).toBe(payload.jobsModulePath);
	// 		expect(parsed.initModulePath).toBe(payload.initModulePath);
	// 		expect(parsed.params).toBe(payload.params);
	// 	});
	//
	// 	it('should only require "jobsModulePath"', function() {
	// 		var parsed = util.parseWorkerPayload({
	// 			jobsModulePath: 'path/to/jobs'
	// 		});
	// 		expect(parsed).toBeA(Object);
	// 		expect(Object.getOwnPropertyNames(parsed).sort()).toEqual(props);
	// 		expect(parsed.jobsModulePath).toBe('path/to/jobs');
	// 		expect(parsed.initModulePath).toBe(null);
	// 		expect(parsed.params).toBe(null);
	// 	});
	//
	// 	it('should throw InvalidWorkerPayloadError if "jobsModulePath" is not a non-empty string', function() {
	// 		expect(function() {
	// 			util.parseWorkerPayload({});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'jobsModulePath'
	// 		});
	//
	// 		expect(function() {
	// 			util.parseWorkerPayload({
	// 				jobsModulePath: null
	// 			});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'jobsModulePath'
	// 		});
	//
	// 		expect(function() {
	// 			util.parseWorkerPayload({
	// 				jobsModulePath: ''
	// 			});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'jobsModulePath'
	// 		});
	// 	});
	//
	// 	it('should throw InvalidWorkerPayloadError if "initModulePath" is not a non-empty string', function() {
	// 		expect(function() {
	// 			util.parseWorkerPayload({
	// 				jobsModulePath: '/path/to/jobs',
	// 				initModulePath: false
	// 			});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'initModulePath'
	// 		});
	//
	// 		expect(function() {
	// 			util.parseWorkerPayload({
	// 				jobsModulePath: '/path/to/jobs',
	// 				initModulePath: ''
	// 			});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'initModulePath'
	// 		});
	//
	// 		expect(function() {
	// 			util.parseWorkerPayload({
	// 				jobsModulePath: '/path/to/jobs',
	// 				initModulePath: {}
	// 			});
	// 		}).toThrowWithProps(errors.InvalidWorkerPayloadError, {
	// 			propName: 'initModulePath'
	// 		});
	// 	});
	// });

	describe('getUniqueKey', function() {
		it('should return null if jobConfig does not have "unique" or "uniqueKey"', function() {
			expect(util.getUniqueKey({}, {})).toBe(null);
		});

		it('should return UNIQUE_KEY constant if jobConfig has truthy "unique"', function() {
			expect(util.getUniqueKey({ unique: true }, {})).toBe(constants.UNIQUE_KEY);
		});

		it('should call "uniqueKey" with params', function() {
			var spy = expect.createSpy().andReturn('FOO');
			var jobConfig = { uniqueKey: spy };
			var params = {};
			expect(util.getUniqueKey(jobConfig, params)).toBe('FOO');
			expect(spy.calls.length).toBe(1);
			expect(spy.calls[0].context).toBe(jobConfig);
			expect(spy.calls[0].arguments.length).toBe(1);
			expect(spy.calls[0].arguments[0]).toBe(params);
		});

		it('should return null if "uniqueKe" returns null or undefined', function() {
			expect(util.getUniqueKey({ uniqueKey: function() {} }, {})).toBe(null);
			expect(util.getUniqueKey({ uniqueKey: function() { return null; } }, {})).toBe(null);
		});

		it('should throw an error if "uniqueKey" does not return a string, null or undefined', function() {
			expect(function() {
				util.getUniqueKey({ uniqueKey: function() { return 5; } }, {});
			}).toThrow(errors.InvalidUniqueKeyError);
			expect(function() {
				util.getUniqueKey({ uniqueKey: function() { return {}; } }, {});
			}).toThrow(errors.InvalidUniqueKeyError);
			expect(function() {
				util.getUniqueKey({ uniqueKey: function() { return []; } }, {});
			}).toThrow(errors.InvalidUniqueKeyError);
			expect(function() {
				util.getUniqueKey({ uniqueKey: function() { return false; } }, {});
			}).toThrow(errors.InvalidUniqueKeyError);
		});
	});

	describe('objectValues', function() {
		it('should return values in the same order as keys', function() {
			var obj = { c: 'C', a: 'A', b: 'B' };
			expect(Object.keys(obj)).toEqual(['c', 'a', 'b']);
			expect(util.objectValues(obj)).toEqual(['C', 'A', 'B']);
		});

		it('should not return values for non-enumerable props', function() {
			var obj = { c: 'C', a: 'A', b: 'B' };
			Object.defineProperty(obj, 'd', {
				enumerable: false,
				value: 'd'
			});
			expect(Object.keys(obj)).toEqual(['c', 'a', 'b']);
			expect(util.objectValues(obj)).toEqual(['C', 'A', 'B']);
		});

		it('should not return values for inherited props', function() {
			function ObjSuper() {}
			ObjSuper.prototype.superProp = 'X';

			var obj = new ObjSuper();
			obj.c = 'C';

			expect(obj.superProp).toBe('X');
			expect(Object.keys(obj)).toEqual(['c']);
			expect(util.objectValues(obj)).toEqual(['C']);
		});
	});

	describe('validateJobParams', function() {
		it('should return Promise if jobConfig has no validate', function() {
			var ret = util.validateJobParams({}, {});
			expect(ret).toBeA(Promise);
			return ret.then(function(v) {
				expect(v).toBe(void 0);
			});
		});

		it('should call validate with correct arguments', function() {
			var spy = expect.createSpy().andReturn({});
			var jobConfig = {
				validate: spy
			};
			var params = {};
			var ret = util.validateJobParams(jobConfig, params);
			expect(ret).toBeA(Promise);
			expect(spy.calls.length).toBe(1);
			expect(spy.calls[0].context).toBe(jobConfig);
			expect(spy.calls[0].arguments.length).toBe(2);
			expect(spy.calls[0].arguments[0]).toBe(params);
			expect(spy.calls[0].arguments[1]).toBe(errors.InvalidJobParamError);
			return ret.then(function(v) {
				expect(v).toBe(void 0);
			});
		});

		it('should catch error thrown by validate', function() {
			var expectedErr;
			var jobConfig = {
				validate: function(params, InvalidJobParamError) {
					expectedErr = new InvalidJobParamError('Nope');
					throw expectedErr;
				}
			};
			var ret = util.validateJobParams(jobConfig, {});
			expect(ret).toBeA(Promise);
			return ret.then(function() {
				throw new Error('should not have resolved');
			}, function(err) {
				expect(err).toBe(expectedErr);
			});
		});

		it('should handle Promise returned by validate', function() {
			var jobConfig = {
				validate: function() {
					return Promise.resolve()
						.then(function() {
							return {};
						});
				}
			};
			var ret = util.validateJobParams(jobConfig, {});
			expect(ret).toBeA(Promise);
			return ret.then(function(v) {
				expect(v).toBe(void 0);
			});
		});

		it('should catch error thrown by validate', function() {
			var expectedErr;
			var jobConfig = {
				validate: function(params, InvalidJobParamError) {
					return Promise.resolve()
						.then(function() {
							expectedErr = new InvalidJobParamError('Nope');
							throw expectedErr;
						});
				}
			};
			var ret = util.validateJobParams(jobConfig, {});
			expect(ret).toBeA(Promise);
			return ret.then(function() {
				throw new Error('should not have resolved');
			}, function(err) {
				expect(err).toBe(expectedErr);
			});
		});
	});

	describe('onlyOneCallback', function() {
		it('should fail if less than three arguments', function() {
			var noop = function() {};
			expect(function() {
				util.onlyOneCallback();
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop);
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop, noop);
			}).toThrow();
		});

		it('should fail if any arguments are not a function', function() {
			var noop = function() {};
			expect(function() {
				util.onlyOneCallback(null, null, null);
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop, null, null);
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop, null, noop);
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop, noop, null);
			}).toThrow();
			expect(function() {
				util.onlyOneCallback(noop, noop, noop, null);
			}).toThrow();
		});

		it('should call the first argument with the callbacks', function() {
			var ret = {};
			var spy = expect.createSpy().andReturn(ret);
			var ctx = {};
			var fn1 = function(){};
			var fn2 = function(){};
			expect(util.onlyOneCallback.call(ctx, spy, fn1, fn2)).toBe(ret);
			expect(spy.calls.length).toBe(1);
			expect(spy.calls[0].context).toBe(ctx);
			expect(spy.calls[0].arguments.length).toBe(2);
			expect(spy.calls[0].arguments[0]).toBeA(Function);
			expect(spy.calls[0].arguments[1]).toBeA(Function);
		});

		it('should only allow one callback to be called', function() {
			(function() {
				var ctx = {};
				var spy1 = expect.createSpy();
				var spy2 = expect.createSpy();
				util.onlyOneCallback(function(fn1, fn2) {
					fn1.call(ctx, 'a', 'b');
					fn2();
					fn1();
					fn2();
				}, spy1, spy2);
				expect(spy1.calls.length).toBe(1);
				expect(spy2.calls.length).toBe(0);
				expect(spy1.calls[0].context).toBe(ctx);
				expect(spy1.calls[0].arguments).toEqual(['a', 'b']);
			})();

			(function() {
				var ctx = {};
				var spy1 = expect.createSpy();
				var spy2 = expect.createSpy();
				var spy3 = expect.createSpy();
				util.onlyOneCallback(function(fn1, fn2, fn3) {
					fn2.call(ctx, 'a', 'b');
					fn1();
					fn2();
					fn1();
					fn3();
				}, spy1, spy2, spy3);
				expect(spy2.calls.length).toBe(1);
				expect(spy1.calls.length).toBe(0);
				expect(spy3.calls.length).toBe(0);
				expect(spy2.calls[0].context).toBe(ctx);
				expect(spy2.calls[0].arguments).toEqual(['a', 'b']);
			})();
		});
	});

	describe('rejectOnThrow', function() {
		it('should return a function', function() {
			expect(util.rejectOnThrow(function(){}, function(){})).toBeA(Function);
		});

		it('should call second argument with arguments and context', function() {
			var spy = expect.createSpy();
			var ctx = {};
			var obj = {};
			util.rejectOnThrow(function(){}, spy).call(ctx);
			util.rejectOnThrow(function(){}, spy).call(ctx, 'a', 'b', obj);
			expect(spy.calls.length).toBe(2);
			expect(spy.calls[0].context).toBe(ctx);
			expect(spy.calls[0].arguments).toEqual([]);
			expect(spy.calls[1].context).toBe(ctx);
			expect(spy.calls[1].arguments).toEqual(['a', 'b', obj]);
			expect(spy.calls[1].arguments[2]).toBe(obj);
		});

		it('should call first argument if error is thrown', function() {
			var spy = expect.createSpy();
			var ctx = {};
			var err = new Error('nope');
			util.rejectOnThrow(spy, function(){ throw err; }).call(ctx);
			expect(spy.calls.length).toBe(1);
			expect(spy.calls[0].arguments).toEqual([err]);
		});
	});

	describe('promiseTry', function() {
		it('should return a Promise', function() {
			expect(util.promiseTry(function(){})).toBeA(Promise);
		});

		it('should resolve correctly', function() {
			var promise;
			expect(function() {
				promise = util.promiseTry(function() {
					return Promise.resolve('aa')
						.then(function() {
							return 'bb';
						})
				});
			}).toNotThrow();

			return promise.then(function(result) {
				expect(result).toBe('bb');
			});
		});

		it('should catch errors', function() {
			var err = new Error('aaa');
			var promise;
			expect(function() {
				promise = util.promiseTry(function(){throw err;});
			}).toNotThrow();

			return promise.then(function() {
				throw new Error('should have thrown an error');
			}, function(err) {
				expect(err).toBe(err);
			});
		});

		it('should run the fn synchronously', function() {
			var fn = expect.createSpy();
			var promise = util.promiseTry(fn);
			expect(fn.calls.length).toBe(1);
			return promise;
		});
	});

	describe('dehydrateError', function() {
		it('should convert a string to an object with a message property', function() {
			var dehydrated = util.dehydrateError('msg');
			expect(dehydrated).toBeA(Object);
			expect(dehydrated.name).toBe('Error');
			expect(dehydrated.message).toBe('msg');
		});

		it('should get all "own" properties', function() {
			var err = new Error('msg');
			Object.defineProperty(err, 'foo', {
				enumerable: false,
				value: 'bar'
			});

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack', 'foo']);
			expect(dehydrated.foo).toBe('bar');
		});

		it('should skip function properties', function() {
			var err = new Error('msg');
			err.foo = function() {};

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack']);
		});

		it('should skip regexp properties', function() {
			var err = new Error('msg');
			err.foo = /./;

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack']);
		});

		it('should dehydrate nested arrays', function() {
			var err = new Error('msg');
			err.foo = ['bar', [500]];

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack', 'foo']);
			expect(dehydrated.foo).toNotBe(err.foo);
			expect(dehydrated.foo).toBeA(Array);
			expect(dehydrated.foo.length).toEqual(2);
			expect(dehydrated.foo[0]).toBe('bar');
			expect(dehydrated.foo[1]).toNotBe(err.foo[1]);
			expect(dehydrated.foo[1]).toBeA(Array);
			expect(dehydrated.foo[1].length).toEqual(1);
			expect(dehydrated.foo[1][0]).toBe(500);

		});

		it('should dehydrate nested objects', function() {
			var err = new Error('msg');
			err.foo = {
				rab: 500,
				bar: {
					oof: 200
				}
			};

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack', 'foo']);
			expect(dehydrated.foo).toNotBe(err.foo);
			expect(dehydrated.foo).toBeA(Object);
			expect(Object.keys(dehydrated.foo)).toEqual(['rab', 'bar']);
			expect(dehydrated.foo.rab).toBe(500);
			expect(dehydrated.foo.bar).toNotBe(err.foo.bar);
			expect(dehydrated.foo.bar).toBeA(Object);
			expect(Object.keys(dehydrated.foo.bar)).toEqual(['oof']);
			expect(dehydrated.foo.bar.oof).toBe(200);
		});

		it('should dehydrate nested Error (or instanceof Error)', function() {
			var err = new Error('msg');
			err.foo = new Error('innermsg');

			var dehydrated = util.dehydrateError(err);
			expect(dehydrated.foo).toBeA(Object);
			expect(dehydrated.foo).toNotBe(err.foo);
			expect(Object.keys(dehydrated.foo)).toEqual(['name', 'message', 'stack']);
			expect(dehydrated.foo.name).toBe('Error');
			expect(dehydrated.foo.message).toBe('innermsg');
		});

		it('should skip duplicate arrays/objects', function() {
			var err = new Error('msg');
			var dupeObj = {};
			err.foo = dupeObj;
			err.bar = dupeObj;

			var dehydrated = util.dehydrateError(err);
			expect(Object.keys(dehydrated)).toEqual(['name', 'message', 'stack', 'foo']);
		});
	});

	describe('extendDefaultOptions', function() {
		it('should include the defaults', function() {
			var defaults = {
				foo: 500,
				bar: 300
			};
			var parsed = util.extendDefaultOptions({}, defaults);
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed)).toEqual(Object.keys(defaults));
			expect(parsed.foo).toBe(500);
			expect(parsed.bar).toBe(300);
		});

		it('should override defaults and maintain same key order as defaults', function() {
			var defaults = {
				foo: 500,
				bar: 200
			};
			var parsed = util.extendDefaultOptions({
				bar: 200,
				foo: 600
			}, defaults);
			expect(Object.keys(parsed)).toEqual(Object.keys(defaults));
			expect(parsed.foo).toBe(600);
			expect(parsed.bar).toBe(200);
		});

		it('should omit override props not in the defaults', function() {
			var defaults = {
				foo: 500
			};
			var parsed = util.extendDefaultOptions({
				bar: 200
			}, defaults);
			expect(parsed).toBeA('object');
			expect(Object.keys(parsed)).toEqual(Object.keys(defaults));
		});

		it('should omit override props that are not "own"', function() {
			function Super() {
				expect(this.foo).toBe(200);
			}
			Super.prototype.foo = 200;

			var defaults = {
				foo: 500
			};

			var parsed = util.extendDefaultOptions(new Super(), defaults);
			expect(parsed.foo).toBe(500);
		});
	});
});
