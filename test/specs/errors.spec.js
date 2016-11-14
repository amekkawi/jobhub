var errors = require('../../lib/errors');
var expect = require('expect');

describe('errors', function() {
	var errorNames = [
		'InvalidManagerOptionsError',
		'JobAlreadyExistsError',
		'JobNotFoundError',
		'InvalidJobConfigError',
		//'InvalidWorkerPayloadError',
		'InvalidUniqueKeyError',
		'JobForkError',
		'InvalidJobParamError',
		'UnsupportedMiddlewareTypeError',
		'JobWorkerHandlerError'
	].sort();

	it('should export correct errors', function() {
		expect(Object.keys(errors).sort())
			.toEqual(errorNames);
	});

	it('should all prototypes that are instances of Error', function() {
		errorNames.forEach(function(name) {
			expect(errors[name].prototype instanceof Error).toBe(true, name + '.prototype instanceof Error');
		});
	});

	it('should instantiate "InvalidManagerOptionsError"', function() {
		var err = new errors.InvalidManagerOptionsError('msg', 'foo');
		expect(err).toBeA(Error);
		expect(err.name).toBe('InvalidManagerOptionsError');
		expect(err.message).toBe('msg');
		expect(err.propName).toBe('foo');
	});

	it('should instantiate "JobAlreadyExistsError"', function() {
		var err = new errors.JobAlreadyExistsError('foo');
		expect(err).toBeA(Error);
		expect(err.name).toBe('JobAlreadyExistsError');
		expect(err.jobName).toBe('foo');
	});

	it('should instantiate "JobNotFoundError"', function() {
 		var err = new errors.JobNotFoundError('foo');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('JobNotFoundError');
		expect(err.jobName).toBe('foo');
 	});

	it('should instantiate "InvalidJobConfigError"', function() {
 		var err = new errors.InvalidJobConfigError('msg', 'foo', 'bar');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('InvalidJobConfigError');
 		expect(err.message).toBe('msg');
		expect(err.jobName).toBe('foo');
		expect(err.propName).toBe('bar');
 	});

	/*it('should instantiate "InvalidWorkerPayloadError"', function() {
 		var err = new errors.InvalidWorkerPayloadError('foo');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('InvalidWorkerPayloadError');
 		expect(err.message).toBe('');
 	});*/

	it('should instantiate "InvalidUniqueKeyError"', function() {
 		var err = new errors.InvalidUniqueKeyError('foo', 'bar');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('InvalidUniqueKeyError');
		expect(err.jobName).toBe('bar');
		expect(err.keyValue).toBe('foo');
 	});

	it('should instantiate "JobForkError"', function() {
 		var err = new errors.JobForkError('msg', 'foo', 'bar');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('JobForkError');
		expect(err.message).toBe('msg');
		expect(err.jobName).toBe('foo');
		expect(err.jobId).toBe('bar');
		expect(err.hasOwnProperty('error')).toBe(false);
		expect(err.hasOwnProperty('code')).toBe(false);
		expect(err.hasOwnProperty('signal')).toBe(false);

		err = new errors.JobForkError('msg', 'foo', 'bar', {
			error: 'foo'
		});
		expect(err).toBeA(Error);
		expect(err.error).toBe('foo');
		expect(err.hasOwnProperty('code')).toBe(false);
		expect(err.hasOwnProperty('signal')).toBe(false);

		var expectedError = new Error();
		err = new errors.JobForkError('msg', 'foo', 'bar', {
			error: expectedError
		});
		expect(err).toBeA(Error);
		expect(err.error).toBe(expectedError);
		expect(err.hasOwnProperty('code')).toBe(false);
		expect(err.hasOwnProperty('signal')).toBe(false);

		err = new errors.JobForkError('msg', 'foo', 'bar', {
			code: 500
		});
		expect(err).toBeA(Error);
		expect(err.hasOwnProperty('error')).toBe(false);
		expect(err.code).toBe(500);
		expect(err.hasOwnProperty('signal')).toBe(false);

		err = new errors.JobForkError('msg', 'foo', 'bar', {
			signal: 'FOO'
		});
		expect(err).toBeA(Error);
		expect(err.hasOwnProperty('error')).toBe(false);
		expect(err.hasOwnProperty('code')).toBe(false);
		expect(err.signal).toBe('FOO');
	});

	it('should instantiate "InvalidJobParamError"', function() {
 		var err = new errors.InvalidJobParamError('msg');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('InvalidJobParamError');
 		expect(err.message).toBe('msg');
		expect(err.hasOwnProperty('paramName')).toBe(false);
		expect(err.hasOwnProperty('paramValue')).toBe(false);

		err = new errors.InvalidJobParamError('msg', 'foo');
		expect(err).toBeA(Error);
		expect(err.name).toBe('InvalidJobParamError');
		expect(err.message).toBe('msg');
		expect(err.paramName).toBe('foo');
		expect(err.hasOwnProperty('paramValue')).toBe(false);

		err = new errors.InvalidJobParamError('msg', 'foo', 'bar');
		expect(err).toBeA(Error);
		expect(err.name).toBe('InvalidJobParamError');
		expect(err.message).toBe('msg');
		expect(err.paramName).toBe('foo');
		expect(err.paramValue).toBe('bar');
 	});

	it('should instantiate "UnsupportedMiddlewareTypeError"', function() {
 		var err = new errors.UnsupportedMiddlewareTypeError(true, 'foo');
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('UnsupportedMiddlewareTypeError');
 		expect(err.isAsync).toBe(true);
		expect(err.type).toBe('foo');
 	});

	it('should instantiate "JobWorkerHandlerError"', function() {
		expect(errors.JobWorkerHandlerError.TYPES).toBeA(Object);
		expect(errors.JobWorkerHandlerError.TYPES.SUCCESS).toBe('SUCCESS');
		expect(errors.JobWorkerHandlerError.TYPES.ERROR).toBe('ERROR');

		var expectedErrorA = new Error();
		var expectedErrorB = new Error();
 		var err = new errors.JobWorkerHandlerError(errors.JobWorkerHandlerError.TYPES.SUCCESS, expectedErrorA, expectedErrorB);
 		expect(err).toBeA(Error);
 		expect(err.name).toBe('JobWorkerHandlerError');
 		expect(err.original).toBe(expectedErrorA);
		expect(err.error).toBe(expectedErrorB);
 	});
});
