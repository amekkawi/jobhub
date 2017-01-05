var errors = require('../../lib/errors');
var expect = require('expect');
var MiddlewareStore = require('../../lib/MiddlewareStore');

describe('MiddlewareStore', function() {
	it('should add supported types', function() {
		var store = new MiddlewareStore();

		// Starts empty
		expect(store.hasSyncSupport('FOO')).toBe(false);
		expect(store.hasSyncSupport('BAR')).toBe(false);
		expect(store.hasAsyncSupport('FOO')).toBe(false);
		expect(store.hasAsyncSupport('BAR')).toBe(false);
		expect(store.getSupportedSyncTypes()).toEqual([]);
		expect(store.getSupportedAsyncTypes()).toEqual([]);

		expect(store.addSupportedSyncTypes(['FOO'])).toBe(store);
		expect(store.addSupportedAsyncTypes(['BAR'])).toBe(store);

		// Check added
		expect(store.hasSyncSupport('FOO')).toBe(true);
		expect(store.hasSyncSupport('BAR')).toBe(false);
		expect(store.hasAsyncSupport('FOO')).toBe(false);
		expect(store.hasAsyncSupport('BAR')).toBe(true);
		expect(store.getSupportedSyncTypes()).toEqual(['FOO']);
		expect(store.getSupportedAsyncTypes()).toEqual(['BAR']);
	});

	it('should throw error if adding middleware without adding support', function() {
		expect(function() {
			new MiddlewareStore().addSyncMiddleware('FOO', function(){});
		}).toThrowWithProps(errors.UnsupportedMiddlewareTypeError, {
			isAsync: false,
			type: 'FOO'
		});

		expect(function() {
			new MiddlewareStore().addAsyncMiddleware('FOO', function(){});
		}).toThrowWithProps(errors.UnsupportedMiddlewareTypeError, {
			isAsync: true,
			type: 'FOO'
		});
	});

	it('should throw error if running sync without adding support', function() {
		expect(function() {
			new MiddlewareStore()
				.runSyncMiddleware('FOO', {}, [], function() {});
		}).toThrowWithProps(errors.UnsupportedMiddlewareTypeError, {
			isAsync: false,
			type: 'FOO'
		});
	});

	it('should return rejected Promise if running async without adding support', function() {
		var promise = new MiddlewareStore().runAsyncMiddleware('FOO', {}, [], function() {});
		expect(promise).toBeA(Promise);

		return promise.then(function() {
			throw new Error('Expected not to resolve');
		}, function(err) {
			if (!(err instanceof errors.UnsupportedMiddlewareTypeError)) {
				throw err;
			}

			expect(err.isAsync).toBe(true);
			expect(err.type).toBe('FOO');
		});
	});

	it('should run sync with no middleware added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyLast.calls.length).toBe(1);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(3);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);

			return 'BAR';
		});

		store.addSupportedSyncTypes(['FOO']);

		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(ret).toBe('BAR');

		expect(spyLast.calls.length).toBe(1);
	});

	it('should run async with no middleware added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyLast.calls.length).toBe(1);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(3);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);

			return 'BAR';
		});

		store.addSupportedAsyncTypes(['FOO']);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		expect(promise).toBeA(Promise);
		expect(spyLast.calls.length).toBe(0);

		return promise.then(function(result) {
			expect(result).toBe('BAR');
			expect(spyLast.calls.length).toBe(1);
		});
	});

	it('should call sync middleware and in order added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(4);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);
			expect(arguments[3]).toBeA(Function);

			var ret = arguments[arguments.length - 1]();
			expect(ret).toBe('BAR');
			return ret;
		});

		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(4);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);
			expect(arguments[3]).toBeA(Function);

			var ret = arguments[arguments.length - 1]();
			expect(ret).toBe('BAR');
			return ret;
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(3);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);

			return 'BAR';
		});

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddleware('FOO', spyA);
		store.addSyncMiddleware('FOO', spyB);

		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(ret).toBe('BAR');

		expect(spyA.calls.length).toBe(1);
		expect(spyB.calls.length).toBe(1);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should call async middleware and in order added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyAInner = expect.createSpy().andCall(function(result) {
			expect(result).toBe('BAR');
			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyBInner.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return result;
		});
		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(0);
			expect(spyB.calls.length).toBe(0);
			expect(spyBInner.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(4);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);
			expect(arguments[3]).toBeA(Function);

			var promise = arguments[arguments.length - 1]();
			expect(promise).toBeA(Promise);
			return promise.then(spyAInner);
		});

		var spyBInner = expect.createSpy().andCall(function(result) {
			expect(result).toBe('BAR');
			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(0);
			expect(spyB.calls.length).toBe(1);
			expect(spyBInner.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return result;
		});
		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(0);
			expect(spyB.calls.length).toBe(1);
			expect(spyBInner.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(4);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);
			expect(arguments[3]).toBeA(Function);

			var promise = arguments[arguments.length - 1]();
			expect(promise).toBeA(Promise);
			return promise.then(spyBInner);
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(0);
			expect(spyB.calls.length).toBe(1);
			expect(spyBInner.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(1);

			expect(this).toBe(ctx);
			expect(arguments.length).toBe(3);
			expect(arguments[0]).toBe(args[0]);
			expect(arguments[1]).toBe(args[1]);
			expect(arguments[2]).toBe(args[2]);

			return 'BAR';
		});

		store.addSupportedAsyncTypes(['FOO']);
		store.addAsyncMiddleware('FOO', spyA);
		store.addAsyncMiddleware('FOO', spyB);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		expect(promise).toBeA(Promise);

		expect(spyA.calls.length).toBe(0);
		expect(spyAInner.calls.length).toBe(0);
		expect(spyB.calls.length).toBe(0);
		expect(spyBInner.calls.length).toBe(0);
		expect(spyLast.calls.length).toBe(0);

		return promise.then(function(result) {
			expect(result).toBe('BAR');

			expect(spyA.calls.length).toBe(1);
			expect(spyAInner.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyBInner.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
		});
	});

	it('should allow sync middleware to intercept', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze([]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return '500A';
		});

		var spyB = expect.createSpy().andReturn('FOO');
		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddleware('FOO', spyA);
		store.addSyncMiddleware('FOO', spyB);
		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(ret).toBe('500A');

		expect(spyA.calls.length).toBe(1);
		expect(spyA.calls[0].context).toBe(ctx);
		expect(spyA.calls[0].arguments.length).toBe(1);
		expect(spyA.calls[0].arguments[0]).toBeA(Function);

		expect(spyB.calls.length).toBe(0);
		expect(spyLast.calls.length).toBe(0);
	});

	it('should allow async middleware to intercept', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			return 500;
		});

		var spyB = expect.createSpy().andReturn('FOO');
		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedAsyncTypes(['FOO']);
		store.addAsyncMiddleware('FOO', spyA);
		store.addAsyncMiddleware('FOO', spyB);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		return promise.then(function(result) {
			expect(result).toBe(500);
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
		});
	});

	it('should remove sync middleware', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy();
		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddleware('FOO', spyA);
		store.removeSyncMiddleware('FOO', spyA);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(spyA.calls.length).toBe(0);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should remove async middleware', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andReturn('FOO');
		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedAsyncTypes(['FOO']);
		store.addAsyncMiddleware('FOO', spyA);
		store.removeAsyncMiddleware('FOO', spyA);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		return promise.then(function(result) {
			expect(result).toBe('BAR');
			expect(spyA.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(1);
		});
	});

	it('should call sync middleware by priority before the order added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return 'BAR';
		});

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddleware('FOO', spyB, 100);
		store.addSyncMiddleware('FOO', spyA, 10);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(spyA.calls.length).toBe(1);
		expect(spyB.calls.length).toBe(1);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should call async middleware by priority before the order added', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return 'BAR';
		});

		store.addSupportedAsyncTypes(['FOO']);
		store.addAsyncMiddleware('FOO', spyB, 100);
		store.addAsyncMiddleware('FOO', spyA, 10);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		return promise.then(function(result) {
			expect(result).toBe('BAR');
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
		});

	});

	it('should add sync middleware with default priority of 100', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyC.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyC = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return 'BAR';
		});

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddleware('FOO', spyB);
		store.addSyncMiddleware('FOO', spyC, 100.0000001);
		store.addSyncMiddleware('FOO', spyA, 100 - .000001);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(spyA.calls.length).toBe(1);
		expect(spyB.calls.length).toBe(1);
		expect(spyC.calls.length).toBe(1);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should add async middleware with default priority of 100', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(0);
			expect(spyC.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyB = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(0);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyC = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return 'BAR';
		});

		spyA.namex = 'spyA';
		spyB.namex = 'spyB';
		spyC.namex = 'spyC';
		spyLast.namex = 'spyLast';

		store.addSupportedAsyncTypes(['FOO']);
		store.addAsyncMiddleware('FOO', spyB);
		store.addAsyncMiddleware('FOO', spyC, 100.0000001);
		store.addAsyncMiddleware('FOO', spyA, 100 - .000001);

		var promise = store.runAsyncMiddleware('FOO', ctx, args, spyLast);
		return promise.then(function(result) {
			expect(result).toBe('BAR');
			expect(spyA.calls.length).toBe(1);
			expect(spyB.calls.length).toBe(1);
			expect(spyC.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
		});
	});
});
