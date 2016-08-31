var errors = require('../../lib/errors');
var expect = require('expect');

describe('errors', function() {
	var errorNames = [
		'InvalidManagerOptionsError',
		'JobAlreadyExistsError',
		'JobNotFoundError',
		'InvalidJobConfigError',
		'InvalidWorkerPayloadError',
		'InvalidUniqueKeyError',
		'JobForkError',
		'InvalidJobParamError',
		'UnsupportedMiddlewareTypeError'
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

	it('should instantiate "InvalidManagerOptionsError');
	it('should instantiate "JobAlreadyExistsError');
	it('should instantiate "JobNotFoundError');
	it('should instantiate "InvalidJobConfigError');
	it('should instantiate "InvalidWorkerPayloadError');
	it('should instantiate "InvalidUniqueKeyError');
	it('should instantiate "JobForkError');
	it('should instantiate "InvalidJobParamError');
	it('should instantiate "UnsupportedMiddlewareTypeError');
});
