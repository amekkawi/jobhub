var errors = require('./errors');

module.exports = MiddlewareStore;

/**
 * Plugins to customize functionality of jobhub.
 *
 * @class
 */
function MiddlewareStore() {
	this._syncMiddleware = {};
	this._asyncMiddleware = {};
}

/**
 * Add supported sync middleware types.
 *
 * @param {string[]} types
 * @returns {MiddlewareStore}
 */
MiddlewareStore.prototype.addSupportedSyncTypes = function(types) {
	for (var i = 0; i < types.length; i++) {
		var type = types[i];
		if (!this._syncMiddleware[type]) {
			this._syncMiddleware[type] = [];
		}
	}
	return this;
};

/**
 * Add supported async middleware types.
 *
 * @param {string[]} types
 * @returns {MiddlewareStore}
 */
MiddlewareStore.prototype.addSupportedAsyncTypes = function(types) {
	for (var i = 0; i < types.length; i++) {
		var type = types[i];
		if (!this._asyncMiddleware[type]) {
			this._asyncMiddleware[type] = [];
		}
	}
	return this;
};

/**
 * Add a sync middleware.
 *
 * @param {string} type
 * @param {function} middleware
 * @param {number} [priority=100]
 * @throws {UnsupportedMiddlewareTypeError}
 */
MiddlewareStore.prototype.addSyncMiddlware = function(type, middleware, priority) {
	var list = this._syncMiddleware[type];
	if (!list) {
		throw new errors.UnsupportedMiddlewareTypeError(false, type);
	}

	this._syncMiddleware[type] = addMiddleware(list, middleware, priority);
};

/**
 * Add an async middleware.
 *
 * @param {string} type
 * @param {function} middleware
 * @param {number} [priority=100]
 * @throws {UnsupportedMiddlewareTypeError}
 */
MiddlewareStore.prototype.addAsyncMiddlware = function(type, middleware, priority) {
	var list = this._asyncMiddleware[type];
	if (!list) {
		throw new errors.UnsupportedMiddlewareTypeError(true, type);
	}

	this._asyncMiddleware[type] = addMiddleware(list, middleware, priority);
};

/**
 * Get if a sync middleware type is supported.
 *
 * @param {string} type
 * @returns {boolean}
 */
MiddlewareStore.prototype.hasSyncSupport = function(type) {
	return !!this._syncMiddleware[type];
};

/**
 * Get if an async middleware type is supported.
 *
 * @param {string} type
 * @returns {boolean}
 */
MiddlewareStore.prototype.hasAsyncSupport = function(type) {
	return !!this._asyncMiddleware[type];
};

/**
 * Get list of supported sync middleware types.
 *
 * @returns {string[]}
 */
MiddlewareStore.prototype.getSupportedSyncTypes = function() {
	return Object.keys(this._syncMiddleware);
};

/**
 * Get list of supported async middleware types.
 *
 * @returns {string[]}
 */
MiddlewareStore.prototype.getSupportedAsyncTypes = function() {
	return Object.keys(this._asyncMiddleware);
};

/**
 * Remove a sync middleware.
 *
 * @param {string} type
 * @param {function} middleware
 * @throws {UnsupportedMiddlewareTypeError}
 */
MiddlewareStore.prototype.removeSyncMiddlware = function(type, middleware) {
	var list = this._syncMiddleware[type];
	if (!list) {
		throw new errors.UnsupportedMiddlewareTypeError(false, type);
	}

	this._syncMiddleware[type] = removeMiddleware(list, middleware);
};

/**
 * Remove an async middleware.
 *
 * @param {string} type
 * @param {function} middleware
 * @throws {UnsupportedMiddlewareTypeError}
 */
MiddlewareStore.prototype.removeAsyncMiddlware = function(type, middleware) {
	var list = this._asyncMiddleware[type];
	if (!list) {
		throw new errors.UnsupportedMiddlewareTypeError(true, type);
	}

	this._asyncMiddleware[type] = removeMiddleware(list, middleware);
};

/**
 * Run sync middleware for the specified type, context and args.
 *
 * @param {string} type
 * @param {*} context
 * @param {Array} args
 * @param {function} next
 * @returns {*}
 */
MiddlewareStore.prototype.runSyncMiddleware = function(type, context, args, next) {
	var list = this._syncMiddleware[type];
	if (!list) {
		throw new errors.UnsupportedMiddlewareTypeError(false, type);
	}

	return list.reduceRight(function(nextMiddleware, middleware) {
		return function() {
			return middleware.fn.apply(context, args.concat([nextMiddleware]));
		};
	}, function() {
		return next.apply(context, args);
	})();
};

/**
 * Run async middleware for the specified type, context and args.
 *
 * @param {string} type
 * @param {*} context
 * @param {Array} args
 * @param {function} next
 * @returns {Promise}
 */
MiddlewareStore.prototype.runAsyncMiddleware = function(type, context, args, next) {
	var list = this._asyncMiddleware[type];
	if (!list) {
		return Promise.reject(new errors.UnsupportedMiddlewareTypeError(true, type));
	}

	return list.reduceRight(function(nextMiddleware, middleware) {
		return function() {
			return Promise.resolve().then(function() {
				return middleware.fn.apply(context, args.concat([nextMiddleware]));
			});
		};
	}, function() {
		return Promise.resolve().then(function() {
			return next.apply(context, args);
		});
	})();
};

function addMiddleware(list, middleware, priority) {
	if (priority == null) {
		priority = 100;
	}

	// Note: concat is used to avoid mutation of original array
	list = list.concat([{
		index: list.length,
		priority: priority,
		fn: middleware
	}]);

	// Sort by priority and order added
	list.sort(function(a, b) {
		if (a.priority < b.priority) {
			return -1;
		}
		else if (a.priority > b.priority) {
			return 1;
		}
		else if (a.index < b.index) {
			return -1;
		}
		else if (a.index > b.index) {
			return 1;
		}
		else {
			return 0;
		}
	});

	return list;
}

function removeMiddleware(list, middleware) {
	// Note: filter is used to avoid mutation of original array
	return list.filter(function(entry) {
		return entry.fn !== middleware;
	});
}
