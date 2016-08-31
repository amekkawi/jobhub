var errors = require('../../lib/errors');
var expect = require('expect');
var MiddlewareStore = require('../../lib/MiddlewareStore');

describe('MiddlewareStore', function() {
	it('should add supported types', function() {
		var store = new MiddlewareStore();

		expect(store.addSupportedSyncTypes(['FOO'])).toBe(store);
		expect(store.addSupportedAsyncTypes(['BAR'])).toBe(store);
	});

	it('should call middleware', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return arguments[arguments.length - 1]();
		});

		var spyLast = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(1);
			return 'BAR';
		});

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddlware('FOO', spyA);
		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(ret).toBe('BAR');

		expect(spyA.calls.length).toBe(1);
		expect(spyA.calls[0].context).toBe(ctx);
		expect(spyA.calls[0].arguments.length).toBe(4);
		expect(spyA.calls[0].arguments[0]).toBe(args[0]);
		expect(spyA.calls[0].arguments[1]).toBe(args[1]);
		expect(spyA.calls[0].arguments[2]).toBe(args[2]);
		expect(spyA.calls[0].arguments[3]).toBeA(Function);

		expect(spyLast.calls.length).toBe(1);
		expect(spyLast.calls[0].context).toBe(ctx);
		expect(spyLast.calls[0].arguments.length).toBe(3);
		expect(spyLast.calls[0].arguments[0]).toBe(args[0]);
		expect(spyLast.calls[0].arguments[1]).toBe(args[1]);
		expect(spyLast.calls[0].arguments[2]).toBe(args[2]);
	});

	it('should allow middleware to intercept', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze([]);

		var spyA = expect.createSpy().andCall(function() {
			expect(spyA.calls.length).toBe(1);
			expect(spyLast.calls.length).toBe(0);
			return '500A';
		});

		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddlware('FOO', spyA);
		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(ret).toBe('500A');

		expect(spyA.calls.length).toBe(1);
		expect(spyA.calls[0].context).toBe(ctx);
		expect(spyA.calls[0].arguments.length).toBe(1);
		expect(spyA.calls[0].arguments[0]).toBeA(Function);

		expect(spyLast.calls.length).toBe(0);
	});

	it('should call middleware in order added', function() {
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
		store.addSyncMiddlware('FOO', spyA);
		store.addSyncMiddlware('FOO', spyB);
		var ret = store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(ret).toBe('BAR');

		expect(spyA.calls.length).toBe(1);
		expect(spyA.calls[0].context).toBe(ctx);
		expect(spyA.calls[0].arguments.length).toBe(4);
		expect(spyA.calls[0].arguments[0]).toBe(args[0]);
		expect(spyA.calls[0].arguments[1]).toBe(args[1]);
		expect(spyA.calls[0].arguments[2]).toBe(args[2]);
		expect(spyA.calls[0].arguments[3]).toBeA(Function);

		expect(spyB.calls.length).toBe(1);
		expect(spyB.calls[0].context).toBe(ctx);
		expect(spyB.calls[0].arguments.length).toBe(4);
		expect(spyB.calls[0].arguments[0]).toBe(args[0]);
		expect(spyB.calls[0].arguments[1]).toBe(args[1]);
		expect(spyB.calls[0].arguments[2]).toBe(args[2]);
		expect(spyB.calls[0].arguments[3]).toBeA(Function);

		expect(spyLast.calls.length).toBe(1);
		expect(spyLast.calls[0].context).toBe(ctx);
		expect(spyLast.calls[0].arguments.length).toBe(3);
		expect(spyLast.calls[0].arguments[0]).toBe(args[0]);
		expect(spyLast.calls[0].arguments[1]).toBe(args[1]);
		expect(spyLast.calls[0].arguments[2]).toBe(args[2]);
	});

	it('should remove sync middleware', function() {
		var store = new MiddlewareStore();

		var ctx = {};
		var args = Object.freeze(['a', 5, {}]);

		var spyA = expect.createSpy();
		var spyLast = expect.createSpy().andReturn('BAR');

		store.addSupportedSyncTypes(['FOO']);
		store.addSyncMiddlware('FOO', spyA);
		store.removeSyncMiddlware('FOO', spyA);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);

		expect(spyA.calls.length).toBe(0);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should remove async middleware');

	it('should call middleware by priority before order added', function() {
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
		store.addSyncMiddlware('FOO', spyB, 100);
		store.addSyncMiddlware('FOO', spyA, 10);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(spyA.calls.length).toBe(1);
		expect(spyB.calls.length).toBe(1);
		expect(spyLast.calls.length).toBe(1);
	});

	it('should add middleware with default priority of 100', function() {
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
		store.addSyncMiddlware('FOO', spyB);
		store.addSyncMiddlware('FOO', spyC, 100.0000001);
		store.addSyncMiddlware('FOO', spyA, 100 - .000001);
		store.runSyncMiddleware('FOO', ctx, args, spyLast);
		expect(spyA.calls.length).toBe(1);
		expect(spyB.calls.length).toBe(1);
		expect(spyC.calls.length).toBe(1);
		expect(spyLast.calls.length).toBe(1);
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

	it('should throw error if running async without adding support');
});
