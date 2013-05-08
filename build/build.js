
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("tower-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof')
  , slice = [].slice;

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks || (this._callbacks = {});
  (this._callbacks[event] || (this._callbacks[event] = []))
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks || (this._callbacks = {});

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  if (!this._callbacks) return this;

  // all
  if (0 === arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 === arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  if (!this._callbacks) return this;

  this._callbacks || (this._callbacks || {});

  var callbacks = this._callbacks[event];

  if (callbacks) {
    var args = slice.call(arguments, 1);
    callbacks = callbacks.slice(0);
    for (var i = 0, n = callbacks.length; i < n; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks || (this._callbacks = {});
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !!this.listeners(event).length;
};
});
require.register("tower-param/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , validator = require('tower-validator')
  , type = require('tower-type')
  , isArray = require('part-is-array')
  , validators = require('./lib/validators');

/**
 * Expose `param`.
 */

exports = module.exports = param;

/**
 * Expose `Param`.
 */

exports.Param = Param;

/**
 * Expose `collection`.
 */

exports.collection = [];

/**
 * Expose `validator`.
 */

exports.validator = validator.ns('param');

/**
 * Get a `Param`.
 */

function param(name, type, options) {
  if (exports.collection[name])
    return exports.collection[name];

  var instance = new Param(name, type, options);
  exports.collection[name] = instance;
  exports.collection.push(instance);
  exports.emit('define', name, instance);
  return instance;
}

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Instantiate a new `Param`.
 */

function Param(name, type, options){
  if (!type) {
    options = { type: 'string' };
  } else if (isArray(type)) {
    options = { type: 'array' };
    options.itemType = type[0] || 'string';
  } else if ('object' === typeof type) {
    options = type;
  } else {
    options || (options = {});
    options.type = type;
  }

  this.name = name;
  this.type = options.type || 'string';

  if (options.validators) this.validators = [];
  if (options.alias) this.aliases = [ options.alias ];
  else if (options.aliases) this.aliases = options.aliases;

  // XXX: lazily create validators/operators?
  // this.validators = options.validators || [];
  // this.operators = options.operators || [];
}

/**
 * Add validator to stack.
 */

Param.prototype.validator = function(key, val){
  var assert = exports.validator(key);

  (this.validators || (this.validators = []))
    .push(function validate(self, query, constraint){ // XXX: fn callback later
      if (!assert(self, constraint.right.value, val))
        query.errors.push('Invalid Constraint something...');
    });
}

/**
 * Append operator to stack.
 */

Param.prototype.operator = function(name){
  if (!this.operators) {  
    this.operators = [];

    var assert = validator('in');

    (this.validators || (this.validators = []))
      .push(function validate(self, query, constraint){
        if (!assert(self, constraint.operator, self.operators)) {
          query.errors.push('Invalid operator ' + constraint.operator);
        }
      });
  }

  this.operators.push(name);
}

Param.prototype.validate = function(query, constraint, fn){
  if (!this.validators) return true;

  for (var i = 0, n = this.validators.length; i < n; i++) {
    this.validators[i](this, query, constraint);
  }

  return !(query.errors && query.errors.length);
}

Param.prototype.alias = function(key){
  (this.aliases || (this.aliases = [])).push(key);
}

// XXX: this might be too specific, trying it out for now.
Param.prototype.format = function(type, name){
  this.serializer = { type: type, name: name };
}

/**
 * Convert a value into a proper form.
 *
 * Typecasting.
 *
 * @param {Mixed} val
 */
 
Param.prototype.typecast = function(val){
  // XXX: handle item type for array.
  return type(this.type).sanitize(val);
}

validators(exports);
});
require.register("tower-param/lib/validators.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var validator = require('tower-validator');

/**
 * Expose `validators`.
 */

module.exports = validators;

/**
 * Define default validators.
 */

function validators(param) {
  // XXX: todo
  param.validator('present', function(self, obj){
    return null != obj;
  });

  ['eq', 'neq', 'in', 'nin', 'contains', 'gte', 'gt', 'lt', 'lte', 'match'].forEach(function(key){
    param.validator(key, function(self, obj, val){
      return validator(key)(obj, val);
    });
  });
}
});
require.register("tower-stream/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var load = require('tower-load')
  , proto = require('./lib/proto')
  , statics = require('./lib/static')
  , api = require('./lib/api');

/**
 * Expose `stream`.
 */

exports = module.exports = stream;

/**
 * Find or create a stream by `name`.
 *
 * @param {String} name
 * @param {Function} [fn]
 */

function stream(name, fn) {
  if (exports.collection[name]) return exports.collection[name];
  if (exports.load(name)) return exports.collection[name];

  /**
   * Initialize a new `Stream`.
   *
   * @api public
   */

  function Stream(options) {
    options || (options = {});

    for (var key in options) this[key] = options[key];

    this.name = name;
    this.inputs = options.inputs || [];
    this.outputs = options.outputs || [];
    Stream.emit('init', this);
  }

  api.init(name, Stream, statics, proto, stream);

  Stream.action = function(x, fn){
    return stream(Stream.ns + '.' + x, fn);
  }

  if ('function' === typeof fn) Stream.on('exec', fn);

  api.dispatch(stream, name, Stream);

  return Stream;
}

/**
 * Mixin API behavior.
 */

api(exports, statics, proto);

/**
 * Extend the `stream` API under a namespace.
 */

exports.ns = function(ns){
  function stream(name, fn) {
    return exports(ns + '.' + name, fn);
  }

  api.extend(stream, exports);

  stream.exists = function(name){
    return exports.exists(ns + '.' + name);
  }

  return stream;
}

/**
 * Lazy-load.
 */

exports.load = function(name, path){
  return 1 === arguments.length
    ? load(exports, name)
    : load.apply(load, [exports].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Check if `stream` exists by `name`.
 *
 * @param {String} name
 */

exports.exists = function(name){
  // try lazy loading
  if (undefined === exports.collection[name])
    return !!exports.load(name);

  return !!exports.collection[name];
}
});
require.register("tower-stream/lib/static.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Param = require('tower-param').Param
  , Attr = require('tower-attr').Attr;

/**
 * Instantiate a new `Stream`.
 *
 * XXX: rename to `init`.
 *
 * @param {Object} options
 * @api public
 */

exports.create = function(options){
  return new this(options);
}

/**
 * Instantiate a new `Param`.
 *
 * @api public.
 */

exports.param = function(name, type, options){
  this.params || (this.params = []);
  this.context = this.params[name] = new Param(name, type, options);
  this.params.push(this.context);
  return this;
}

/**
 * Instantiate a new `Attr`.
 *
 * @api public.
 */

exports.attr = function(name, type, options){
  this.attrs || (this.attrs = []);
  this.context = this.attrs[name] = new Attr(name, type, options);
  this.attrs.push(this.context);
  return this;
}

exports.alias = function(name){
  this.context.alias(name);
  return this;
}

/**
 * Define a validator.
 *
 * @param {String} key Name of the operator for assertion.
 * @param {Mixed} val
 * @return {this}
 */

exports.validate = function(key, val){
  if (this === this.context)
    // key is a function
    this.validator(key, val)
  else
    // param or attr
    this.context.validator(key, val);

  return this;
}

/**
 * Append a validator function to the stack.
 *
 * @param {Function} fn
 * @return {this}
 */

exports.validator = function(fn){
  // XXX: just a function in this case, but could handle more.
  this.validators.push(fn);
  return this;
}

/**
 * Reset the `context` to `this`.
 *
 * @return {this}
 */

exports.self = function(){
  return this.context = this;
}
});
require.register("tower-stream/lib/proto.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var noop = function(){} // XXX: temp until async emitter.

/**
 * Execute the stream.
 */

exports.exec = function(data, fn){
  this.constructor.emit('exec', this, data, fn || noop);
  // XXX: need to handle with/without cases.
  //if (fn) fn();
}

/**
 * Open the stream.
 */

exports.open = function(data, fn){
  // XXX: refactor
  if (this.constructor.hasListeners('open'))
    this.constructor.emit('open', this, data, fn || noop);
  if (this.hasListeners('open'))
    this.emit('open', fn || noop);

  if (!this.hasListeners('open') && !this.constructor.hasListeners('open'))
    fn();
}

/**
 * Close the stream.
 */

exports.close = function(fn){
  this.constructor.emit('close', this, fn);
  this.emit('close', fn);
}
});
require.register("tower-stream/lib/api.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter');

/**
 * Expose `constructorFn`
 */

exports = module.exports = api;

/**
 * Setup the DSL API for a library.
 *
 * This is called once per "apiFn method".
 */

function api(apiFn, statics, proto){
  apiFn.collection = [];

  // mixin `Emitter`

  Emitter(apiFn);
  Emitter(statics);
  Emitter(proto);

  apiFn.clear = clear.bind(apiFn);
  apiFn.remove = remove.bind(apiFn);

  return apiFn;
}

/**
 * Add base behavior to a `Function`.
 *
 * This is called inside the API method.
 */

exports.init = function(name, fn, statics, proto, apiFn){
  fn.id = name;

  // namespace

  fn.ns = name.replace(/\.\w+$/, '');

  // statics

  for (var key in statics) fn[key] = statics[key];

  // prototype

  fn.prototype = {};
  fn.prototype.constructor = fn;
  
  for (var key in proto) fn.prototype[key] = proto[key];

  apiFn.collection[name] = fn;
  apiFn.collection.push(fn);

  return apiFn;
}

/**
 * Emit events for the `name`,
 * so that external libraries can add extensions.
 */

exports.dispatch = function(apiFn, name, fn){
  var parts = name.split('.');

  for (var i = 1, n = parts.length + 1; i < n; i++) {
    apiFn.emit('define ' + parts.slice(0, i).join('.'), fn);
  }

  apiFn.emit('define', fn);

  return apiFn;
}

/**
 * Scope the `constructorFn` names under a namespace.
 */

exports.extend = function(childApi, parentApi){
  // XXX: copy functions?
  for (var key in parentApi) {
    if ('function' === typeof parentApi[key])
      childApi[key] = parentApi[key];
  }
  return childApi;
}

/**
 * Clear API behavior.
 */

function clear(){
  // remove all listeners
  this.off();

  while (this.collection.length)
    this.remove(this.collection.pop());

  return this;
}

function remove(val, i){
  var emitter = this.collection[val] || val;
  emitter.off();
  delete this.collection[emitter.id];
  // XXX: delete from collection array.
}
});
require.register("part-each-array/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var nativeForEach = [].forEach;

/**
 * Expose `each`.
 */

module.exports = each;

/**
 * Array iterator.
 */

function each(array, iterator, context) {
  if (null == array) return;
  if (nativeForEach && array.forEach === nativeForEach) {
    array.forEach(iterator, context);
  } else {
    for (var i = 0, n = array.length; i < l; i++) {
      if (false === iterator.call(context, array[i], i, array)) return;
    }
  }
}

});
require.register("part-is-array/index.js", function(exports, require, module){

/**
 * Expose `isArray`.
 */

module.exports = Array.isArray || isArray;

function isArray(obj) {
  return '[object Array]' === toString.call(obj);
}
});
require.register("tower-query/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var each = require('part-each-array')
  , isArray = require('part-is-array')
  , Constraint = require('./lib/constraint')
  , validate = require('./lib/validate');

/**
 * Expose `query`.
 */

exports = module.exports = query;

/**
 * Expose `Query`.
 */

exports.Query = Query;

/**
 * Expose `Constraint`.
 */

exports.Constraint = Constraint;

/**
 * Wrap an array for chaining query criteria.
 */

function query(name) {
  return null == name
    ? new Query
    : exports.collection[name]
      ? exports.collection[name].clone()
      : (exports.collection[name] = new Query(name));
}

/**
 * Named queries.
 */

exports.collection = {};

/**
 * Queryable adapters.
 */

exports.adapters = [];

/**
 * Make an adapter queryable.
 *
 * XXX: The main reason for doing it this way
 *      is to not create circular dependencies.
 */

exports.use = function(adapter){
  exports.adapters[adapter.name] = adapter;
  exports.adapters.push(adapter);
  return exports;
}

/**
 * Construct a new `Query` instance.
 */

function Query(name, criteria) {
  this.name = name;
  this.criteria = criteria || [];
}

/**
 * Explicitly tell the query what adapters to use.
 *
 * If not specified, it will do its best to find
 * the adapter. If one or more are specified, the
 * first specified will be the default, and its namespace
 * can be left out of the models used in the query
 * (e.g. `user` vs. `facebook.user` if `query().use('facebook').select('user')`).
 *
 * @param {Mixed} name Name of the adapter, or the adapter object itself.
 *   In `package.json`, maybe this is under a `"key": "memory"` property.
 * @return {this}
 */

Query.prototype.use = function(name){
  (this.adapters || (this.adapters = []))
    .push('string' === typeof name ? exports.adapters[name] : name);
  return this;
}

/**
 * The starting table or record for the query.
 *
 * @param {String} key
 * @param {Object} [val]
 * @api public
 */

Query.prototype.start = function(key, val){
  this._start = key;
  return this.push('start', queryModel(key));
}

Query.prototype.where = function(key){
  this.context = key;
  return this;
}

/**
 * Define another query on the parent scope.
 *
 * XXX: wire this up with the model (for todomvc).
 */

Query.prototype.query = function(name) {
  return query(name);
}

/**
 * In a graph database, the data pointing _to_ this node.
 * In a relational/document database, the records with
 * a foreign key pointing to this record or set of records.
 *
 * Example:
 *
 *    query().start('users')
 *      .incoming('friends')
 *      .incoming('friends');
 *
 * @param {String} key
 * @api public
 */

Query.prototype.incoming = function(key){
  return this.relation('incoming', key);
}

/**
 * In a graph database, the data pointing _from_ this node.
 * In a relational/document database, the record this
 * record points to via its foreign key.
 *
 * Example:
 *
 *    query().start('users')
 *      .outgoing('friends')
 *      .outgoing('friends');
 *
 * @param {String} key
 * @api public
 */

Query.prototype.outgoing = function(key){
  return this.relation('outgoing', key);
}

/**
 * What the variable should be called for the data returned.
 * References the previous item in the query.
 *
 * Example:
 *
 *    query().start('users').as('people');
 *
 * @param {String} key
 * @api public
 */

Query.prototype.as = function(key){
  return this.push('as', key);
}

/**
 * Append constraint to query.
 *
 * Example:
 *
 *    query().start('users').where('likeCount').lte(200);
 *
 * @param {String}       key  The property to compare `val` to.
 * @param {Number|Date}  val
 * @api public
 */

each(['eq', 'neq', 'gte', 'gt', 'lte', 'lt', 'nin', 'match'], function(operator){
  Query.prototype[operator] = function(val){
    return this.constraint(this.context, operator, val);
  }
});

Query.prototype.contains = function(val){
  return this.constraint(this.context, 'in', val);
}

/**
 * Append action to query, then execute.
 *
 * Example:
 *
 *    query().start('users')
 *      .insert({ email: 'john.smith@gmail.com' });
 *
 *    query().start('users').query(fn);
 *
 * @api public
 */

each([
    'find'
  , 'remove'
  , 'pipe'
  , 'stream'
  , 'count'
  , 'exists'
], function(action){
  Query.prototype[action] = function(fn){
    return this.action(action).exec(fn);
  }
});

Query.prototype.all = Query.prototype.find;

/**
 * Create one or more records.
 *
 * This is different from the other actions 
 * in that it can take data (records) as arguments.
 */

Query.prototype.create = function(data, fn){
  return this.action('create', data).exec(fn);
}

Query.prototype.update = function(data, fn){
  return this.action('update', data).exec(fn);
}

// XXX

Query.prototype.first = function(fn){
  this.limit(1).action('find').exec(function(err, records){
    if (err) return fn(err);
    fn(err, records[0]);
  });
}

// XXX: default sorting param

Query.prototype.last = function(fn){
  this.limit(1).action('find').exec(function(err, records){
    if (err) return fn(err);
    fn(err, records[0]);
  });
}

/**
 * Sort ascending by `key`.
 *
 * If the key is a property name, it will
 * be combined with the table/collection name
 * defined somewhere earlier in the query.
 *
 * Example:
 *
 *    query().start('users').asc('createdAt');
 *
 * @param {String} key
 * @api public
 */

Query.prototype.asc = function(key){
  return this.order(1, key);
}

/**
 * Sort descending by `key`.
 *
 * If the key is a property name, it will
 * be combined with the table/collection name
 * defined somewhere earlier in the query.
 *
 * Example:
 *
 *    query().start('users').desc('createdAt');
 *
 * @param {String} key
 * @api public
 */

Query.prototype.desc = function(key){
  return this.order(-1, key);
}

Query.prototype.returns = function(key){
  return this.push('return', key);
}

Query.prototype.select = function(key){
  this._start = this._start || key;
  return this.push('select', queryAttr(key, this._start));
}

/**
 * Pushes a `"relation"` onto the query.
 *
 * @param {String} type
 * @param {String} key
 * @api private
 */

Query.prototype.relation = function(dir, key){
  var attr = queryAttr(key, this._start);
  attr.direction = dir;
  return this.push('relation', attr);
}

/**
 * Pushes a `"constraint"` onto the query.
 *
 * @param {String} op Operator string
 * @param {String} key
 * @param {Object} val
 * @api public
 *
 * @see http://en.wikipedia.org/wiki/Lagrange_multiplier
 */

Query.prototype.constraint = function(key, op, val){
  return this.push('constraint', new Constraint(key, op, val, this._start));
}

/**
 * Pushes an `"action"` onto the query.
 *
 * Example:
 *
 *    query().action('insert', { message: 'Test' });
 *    query().action('insert', [ { message: 'one.' }, { message: 'two.' } ]);
 *
 * @param {String} type
 * @param {Object|Array} data The data to act on.
 * @api private
 */

Query.prototype.action = function(type, data){
  return this.push('action', { type: type, data: data ? isArray(data) ? data : [data] : undefined });
}

// XXX: only do if it decreases final file size
// each(['find', 'create', 'update', 'delete'])

/**
 * Pushes a sort direction onto the query.
 *
 * @param {Integer} dir   Direction it should point (-1, 1, 0).
 * @param {String}  key   The property to sort on.
 * @api private
 */

Query.prototype.order = function(dir, key){
  var attr = queryAttr(key, this._start);
  attr.direction = key;
  return this.push('order', attr);
}

/**
 * Push criterion onto query.
 * 
 * @api private
 */

Query.prototype.push = function(type, data){
  this.criteria.push([type, data]);
  return this;
}

/**
 * Get the number of criteria in the query.
 */

Query.prototype.size = function(){
  return this.criteria.length;
}

/**
 * Reset all criteria.
 */

Query.prototype.reset = function(){
  this.criteria = [];
  return this;
}

/**
 * A way to log the query criteria,
 * so you can see if the adapter supports it.
 */

Query.prototype.explain = function(fn){
  this._explain = fn;
  return this;
}

Query.prototype.clone = function(){
  return new Query(this.name, this.criteria.concat());
}

/**
 * XXX: For now, only one query per adapter.
 *      Later, you can query across multiple adapters
 *
 * @see http://en.wikipedia.org/wiki/Query_optimizer
 * @see http://en.wikipedia.org/wiki/Query_plan
 * @see http://homepages.inf.ed.ac.uk/libkin/teach/dbs12/set5.pdf
 */

Query.prototype.exec = function(fn){
  this.context = this._start = undefined;
  var adapter = this.adapters && this.adapters[0] || exports.adapters[0];
  this.validate(function(){});
  if (this.errors && this.errors.length) return fn(this.errors);
  return adapter.exec(this, fn);
}

Query.prototype.validate = function(fn){
  var adapter = this.adapters && this.adapters[0] || exports.adapters[0];
  validate(this, adapter, fn);
}

function queryModel(key) {
  key = key.split('.');

  if (2 === key.length)
    return { adapter: key[0], model: key[1], ns: key[0] + '.' + key[1] };
  else
    return { model: key[0], ns: key[0] }; // XXX: adapter: adapter.default()
}

/**
 * Variables used in query.
 */

function queryAttr(val, start){
  var variable = {};

  val = val.split('.');

  switch (val.length) {
    case 3:
      variable.adapter = val[0];
      variable.model = val[1];
      variable.attr = val[2];
      variable.ns = variable.adapter + '.' + variable.model;
      break;
    case 2:
      variable.adapter = 'memory'; // XXX: adapter.default();
      variable.model = val[0];
      variable.attr = val[1];
      variable.ns = variable.model;
      break;
    case 1:
      variable.adapter = 'memory'; // XXX: adapter.default();
      variable.model = start;
      variable.attr = val[0];
      variable.ns = variable.model;
      break;
  }

  variable.path = variable.ns + '.' + variable.attr;

  return variable;
}

function queryValue(val) {
  // XXX: eventually handle relations/joins.
  return { value: val, type: typeof(val) };
}
});
require.register("tower-query/lib/constraint.js", function(exports, require, module){

/**
 * Expose `Constraint`.
 */

module.exports = Constraint;

/**
 * Instantiate a new `Constraint`.
 */

function Constraint(a, operator, b, start) {
  this.left = left(a, start);
  this.operator = operator;
  this.right = right(b);
}

function left(val, start) {
  var variable = {};

  val = val.split('.');

  switch (val.length) {
    case 3:
      variable.adapter = val[0];
      variable.model = val[1];
      variable.attr = val[2];
      variable.ns = variable.adapter + '.' + variable.model;
      break;
    case 2:
      variable.adapter = 'memory'; // XXX: adapter.default();
      variable.model = val[0];
      variable.attr = val[1];
      variable.ns = variable.model;
      break;
    case 1:
      variable.adapter = 'memory'; // XXX: adapter.default();
      variable.model = start;
      variable.attr = val[0];
      variable.ns = variable.model;
      break;
  }
  
  variable.path = variable.ns + '.' + variable.attr;

  return variable;
}

function right(val) {
  // XXX: eventually handle relations/joins.
  return { value: val, type: typeof(val) };
}
});
require.register("tower-type/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , validator = require('tower-validator')
  , types = require('./lib/types');

/**
 * Expose `type`.
 */

exports = module.exports = type;

/**
 * Expose `Type`.
 */

exports.Type = Type;

/**
 * Expose `collection`.
 */

exports.collection = [];

/**
 * Expose `validator`.
 */

exports.validator = validator.ns('type');

/**
 * Define or get a type.
 */

function type(name, fn) {
  if (undefined === fn && exports.collection[name])
      return exports.collection[name];

  var instance = new Type(name, fn);
  exports.collection[name] = instance;
  exports.collection.push(instance);
  exports.emit('define', name, instance);
  return instance;
}

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Check if validator exists.
 *
 * @param {String} name
 */

exports.has = function(name){
  return !!exports.collection[name];
}

/**
 * Scope validators to a namespace.
 */

exports.ns = function(ns){
  return function type(name, fn) {
    return exports(ns + '.' + name, fn);
  }
}

/**
 * Remove all validators.
 */

exports.clear = function(){
  var collection = exports.collection;

  exports.off();
  for (var key in collection) {
    if (collection.hasOwnProperty(key)) {
      delete collection[key];
    }
  }
  collection.length = 0;
  return exports;
}

function Type(name, fn) {
  // XXX: name or path? maybe both.
  this.name = name;
  // XXX: or maybe just delegate:
  // this.validator = type.validator.ns(name);
  // that might reduce memory quite a bit.
  // even though it's still only a tiny bit of it.
  this.validators = [];
  // serialization/sanitization function.
  if (fn) this.use(fn);
}

Type.prototype.validator = function(name, fn){
  // XXX: see above, this should probably just
  // be happening in `validator.ns(this.name)`.
  exports.validator(this.name + '.' + name, fn);
  this.validators.push(this.validators[name] = fn);
  return this;
}

/**
 * Sanitize functions to pass value through.
 *
 * @param {Function} fn
 * @return {Type} this
 */

Type.prototype.use = function(fn){
  (this.sanitizers || (this.sanitizers = [])).push(fn);
  return this;
}

/**
 * Sanitize (or maybe `serialize`).
 *
 * XXX: maybe rename to `cast`?
 */

Type.prototype.sanitize = function(val){
  if (!this.sanitizers) return val;

  this.sanitizers.forEach(function sanitize(sanitizer){
    val = sanitizer(val);
  });

  return val;
}

/**
 * Seralizer object by name.
 *
 * XXX: Maybe refactor into `tower/serializer` module.
 *
 * @param {String} name
 */

Type.prototype.serializer = function(name){
  this.context = (this.serializers || (this.serializers = {}))[name] = {};
  return this;
}

/**
 * Define how to serialize type from
 * JavaScript to external API/service request format.
 *
 * XXX: to/out/request/serialize/format/use
 *
 * @param {Function} fn
 */

Type.prototype.to = function(fn){
  // XXX: some way to set a default serializer.
  if (!this.context) this.serializer('default');
  this.context.to = fn;
  return this;
}

/**
 * Define how to deserialize type from 
 * external API/service request format to JavaScript.
 *
 * XXX: from/in/response/deserialize
 *
 * @param {Function} fn
 */

Type.prototype.from = function(fn){
  if (!this.context) this.serializer('default');
  this.context.from = fn;
  return this;
}

/**
 * Bring back to parent context.
 *
 * XXX: need more robust way to do this across modules.
 */

Type.prototype.type = function(name){

}

types(exports);
});
require.register("tower-type/lib/types.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var isArray = require('part-is-array');

/**
 * Expose `types`.
 */

module.exports = types;

/**
 * Define basic types and type validators.
 */

function types(type) {
  // XXX: type('string').validator('lte')
  // would default to `validator('gte')` if not explicitly defined.
  type('string')
    .validator('gte', function gte(a, b){
      return a.length >= b.length;
    })
    .validator('gt', function gt(a, b){
      return a.length > b.length;
    });

  type('integer')
    .use(parseInt);

  type('float')
    .use(parseFloat);

  type('number')
    .use(parseFloat);
    
  type('date');
  type('boolean');

  type('array')
    // XXX: test? test('asdf') // true/false if is type.
    // or `validate`
    .use(function(val){
      // XXX: handle more cases.
      return isArray(val)
        ? val
        : val.split(/,\s*/);
    })
    .validator('lte', function lte(a, b){
      return a.length <= b.length;
    });
}
});
require.register("tower-attr/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , validator = require('tower-validator').ns('attr')
  , text = require('tower-inflector')
  , type = require('tower-type')
  , validators = require('./lib/validators');

text('attr', 'Invalid attribute: {{name}}');

/**
 * Expose `attr`.
 */

exports = module.exports = attr;

/**
 * Expose `Attr`.
 */

exports.Attr = Attr;

// XXX:
// module.exports = attr;
// attr('user.email')
// attr.on('define', function(name, obj));

/**
 * Expose `validator`.
 */

exports.validator = validator;

/**
 * Expose `collection`.
 */

exports.collection = [];

/**
 * Get an `Attr`.
 */

function attr(name, type, options) {
  if (exports.collection[name])
    return exports.collection[name];

  var instance = new Attr(name, type, options);
  exports.collection[name] = instance;
  exports.collection.push(instance);
  exports.emit('define', name, instance);
  return instance;
}

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Instantiate a new `Attr`.
 */

function Attr(name, type, options){
  if (!type) {
    options = { type: 'string' };
  } else if ('object' === typeof type) {
    options = type;
  } else {
    if ('object' !== typeof options) {
      options = { value: options };
    } else {
      options || (options = {}); 
    }
    options.type = type;
  }

  this.name = name;
  this.type = options.type || 'string';
  // XXX: I18n path, maybe should be
  // model.user.attr.
  this.path = options.path || 'attr.' + name;
  if (undefined !== options.value) this.value = options.value;

  if (options.validators) this.validators = [];
  if (options.alias) this.aliases = [ options.alias ];
  else if (options.aliases) this.aliases = options.aliases;

  // XXX: maybe it should allow any custom thing to be set?
}

/**
 * Add validator to stack.
 */

Attr.prototype.validator = function(key, val){
  var assert = validator(key);
  // XXX: need some sort of error handling so it's
  // easier to tell `assert` is undefined.

  // lazily instantiate validators
  (this.validators || (this.validators = []))
    .push(function validate(attr, obj, fn){
      if (!assert(attr, obj, val)) {
        // XXX: hook into `tower-inflector` for I18n
        var error = text.has(attr.path)
          ? text(attr.path).render(attr)
          : text('attr').render(attr);

        obj.errors[attr.name] = error;
        obj.errors.push(error);
      }
    });
}

Attr.prototype.alias = function(key){
  (this.aliases || (this.aliases = [])).push(key);
}

Attr.prototype.validate = function(obj, fn){
  if (!this.validators) return fn();

  var self = this;

  // XXX: part-async-series
  this.validators.forEach(function(validate){
    validate(self, obj);
  });

  if (fn) fn(); // XXX
}

/**
 * Convert a value into a proper form.
 *
 * Typecasting.
 *
 * @param {Mixed} val
 */

Attr.prototype.typecast = function(val){
  return type(this.type).sanitize(val);
}

validators(exports);
});
require.register("tower-attr/lib/validators.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var validator = require('tower-validator');

/**
 * Expose `validators`.
 */

module.exports = validators;

/**
 * Define default validators.
 */

function validators(attr) {
  // XXX: maybe this goes into a separate module.
  attr.validator('present', function(self, obj){
    return null != obj.get(self.name);
  });

  ['eq', 'neq', 'in', 'nin', 'contains', 'gte', 'gt', 'lt', 'lte'].forEach(function(key){
    attr.validator(key, function(self, obj, val){
      return validator(key)(obj.get(self.name), val);
    });
  });
}
});
require.register("tower-validator/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , validators = require('./lib/validators');

/**
 * Expose `validator`.
 */

exports = module.exports = validator;

/**
 * All validators in the order they were defined.
 */

exports.collection = [];

/**
 * Get or set a validator function.
 *
 * @param {String} name
 * @param {Function} [fn]
 */

function validator(name, fn) {
  if (undefined === fn) return exports.collection[name];

  exports.collection[name] = fn;
  exports.collection.push(fn);
  exports.emit('define', name, fn);
  
  return fn;
}

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Check if validator exists.
 *
 * @param {String} name
 */

exports.has = function(name){
  return !!exports.collection[name];
}

/**
 * Scope validators to a namespace.
 */

exports.ns = function(ns){
  return function validator(name, fn) {
    return exports(ns + '.' + name, fn);
  }
}

/**
 * Remove all validators.
 */

exports.clear = function(){
  var collection = exports.collection;

  exports.off('define');
  for (var key in collection) {
    if (collection.hasOwnProperty(key)) {
      delete collection[key];
    }
  }
  collection.length = 0;
  return exports;
}

validators(exports);
});
require.register("tower-validator/lib/validators.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var indexof = require('indexof');

/**
 * Expose `validators`.
 */

module.exports = validators;

/**
 * Define basic operators/validators.
 */

function validators(validator) {
  validator('eq', function eq(a, b){
    return a === b;
  });

  validator('neq', function neq(a, b){
    return a !== b;
  });

  validator('contains', function contains(a, b){
    return !!~indexof(b, a);
  });

  validator('in', validator('contains'));

  validator('excludes', function nin(a, b){
    return !~indexof(b, a);
  });

  validator('nin', validator('excludes'));

  validator('gte', function gte(a, b){
    return a >= b;
  });

  validator('gt', function gt(a, b){
    return a > b;
  });

  validator('lte', function gte(a, b){
    return a <= b;
  });

  validator('lt', function gt(a, b){
    return a < b;
  });

  validator('match', function match(a, b){
    return !!a.match(b);
  });
}
});
require.register("component-stack/index.js", function(exports, require, module){

/**
 * Expose `stack()`.
 */

module.exports = stack;

/**
 * Return the stack.
 *
 * @return {Array}
 * @api public
 */

function stack() {
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}
});
require.register("component-assert/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var stack = require('stack');

/**
 * Load contents of `script`.
 *
 * @param {String} script
 * @return {String}
 * @api private
 */

function getScript(script) {
  var xhr = new XMLHttpRequest;
  xhr.open('GET', script, false);
  xhr.send(null);
  return xhr.responseText;
}

/**
 * Assert `expr` with optional failure `msg`.
 *
 * @param {Mixed} expr
 * @param {String} [msg]
 * @api public
 */

module.exports = function(expr, msg){
  if (expr) return;
  if (!msg) {
    if (Error.captureStackTrace) {
      var callsite = stack()[1];
      var fn = callsite.fun.toString();
      var file = callsite.getFileName();
      var line = callsite.getLineNumber() - 1;
      var col = callsite.getColumnNumber() - 1;
      var src = getScript(file);
      line = src.split('\n')[line].slice(col);
      expr = line.match(/assert\((.*)\)/)[1].trim();
      msg = expr;
    } else {
      msg = 'assertion failed';
    }
  }

  throw new Error(msg);
};
});
require.register("tower-inflector/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var context;

/**
 * Expose `text`.
 */

exports = module.exports = text;

/**
 * Example:
 *
 *    text('messages')
 *
 * @param {String} key
 * @api public
 */

function text(key, val){
  return undefined === val
    ? (locale[key] || (locale[key] = new Text))
    : (locale[key] = new Text).one(val);
}

exports.has = function(key){
  return !!locale[key];
}

exports.ns = function(ns){
  var fn = function text(key, val) {
    return exports(ns + '.' + key, val);
  }
  fn.text = fn;
}

/**
 * Current language.
 */

var locale;

/**
 * Set locale.
 */

exports.locale = function(val){
  locale = exports[val] = exports[val] || {};
  return exports;
}

/**
 * Default locale is `en`.
 */

exports.locale('en');

/**
 * Instantiate a new `Text`.
 *
 * @api private
 */

function Text() {
  this.inflections = [];
}

/**
 * @param {String} string
 * @api public
 */

Text.prototype.past = function(string){
  return this.inflection(string, context.count, 'past');
};

/**
 * @param {String} string
 * @api public
 */

Text.prototype.present = function(string){
  return this.inflection(string, context.count, 'present');
};

/**
 * @param {String} string
 * @api public
 */

Text.prototype.future = function(string){
  return this.inflection(string, context.count, 'future');
};

/**
 * @param {String} string
 * @param {String} tense
 * @param {String} count
 * @api public
 */

Text.prototype.tense = function(string, tense, count){
  return this.inflection(string, count, tense);
}

/**
 * @param {String} string
 * @api public
 */

Text.prototype.none = function(string){
  return this.inflection(string, 'none');
};

/**
 * @param {String} string
 * @api public
 */

Text.prototype.one = function(string){
  return this.inflection(string, 'one');
};

/**
 * @param {String} string
 * @api public
 */

Text.prototype.other = function(string){
  return this.inflection(string, 'other');
};

/**
 * @param {String} string
 * @param {String} count
 * @param {String} tense
 * @api public
 */

Text.prototype.inflection = function(string, count, tense){
  // this isn't quite correct...
  this.inflections.push(context = {
      string: string
    , count: count == null ? 'all' : count
    , tense: tense || 'present'
  });

  return this;
};

/**
 * This could be a view on the client.
 *
 * @param {Object} options
 * @api public
 */

Text.prototype.render = function(options){
  options || (options = {});

  var count = (options.count ? (1 === options.count ? 'one' : 'other') : 'none')
    , tense = options.tense || 'present'
    , key = tense + '.' + count
    , inflections = this.inflections
    , inflection = inflections[0]
    , currScore = 0
    , prevScore = 0;

  for (var i = 0, n = inflections.length; i < n; i++) {
    currScore = 0
      + (count == inflections[i].count ? 1 : 0)
      + (tense == inflections[i].tense ? 1 : 0);

    if (currScore > prevScore) {
      inflection = inflections[i];
      prevScore = currScore; 
    }
  }

  return inflection.string.replace(/\{\{(\w+)\}\}/g, function(_, $1){
    return options[$1];
  });
}

});
require.register("tower-load/index.js", function(exports, require, module){

/**
 * Expose `load`.
 */

exports = module.exports = load;

/**
 * Map of `api + '.' + key` to absolute module path.
 */

exports.paths = {};

/**
 * Map of path to array of `api + '.' + key`.
 */

exports.keys = {};

/**
 * Map of path to `fn`.
 */

exports.fns = {};

/**
 * Lazy-load a module.
 *
 * This is something like an IoC container.
 * Make sure the `api.toString()` is unique.
 *
 * @param {Function} api
 * @param {String} key
 * @param {Path} path Full `require.resolve(x)` path
 * @api public
 */

function load(api, key, path) {
  return undefined === path
    ? exports.get(api, key)
    : exports.set.apply(exports, arguments);
}

exports.get = function(api, key){
  var path = exports.paths[api.name + '.' + key];
  if (path) {
    var fn = exports.fns[path];
    if (fn) return fn();
  }
}

/**
 * Define how to lazy-load a module.
 */

exports.set = function(api, key, path){
  var pathKey = api.name + '.' + key;
  if (!exports.paths[pathKey]) {
    exports.paths[pathKey] = path;
    (exports.keys[path] || (exports.keys[path] = [])).push(pathKey);
    if (!exports.fns[path]) {
      exports.fns[path] = requireFn(path, Array.prototype.slice.call(arguments, 3));
    }
  }
  return exports;
}

exports.clear = function(path){
  for (var i = 0, n = exports.keys[path].length; i < n; i++) {
    delete exports.paths[exports.keys[path][i]];
  }
  exports.keys[path].length = 0;
  delete exports.keys[path];
  delete exports.fns[path];
}

function requireFn(path, args) {
  return function(obj) {
    // remove all listeners
    exports.clear(path);

    var result = require(path);

    if ('function' === typeof result) {
      //args.unshift(obj);
      result.apply(result, args);
    }
    
    args = undefined;
    return result;
  }
}
});
require.register("part-async-series/index.js", function(exports, require, module){
module.exports = function(fns, val, done){
  var i = 0
    , fn;

  function handle(err) {
    if (err) return done(err);
    next();
  }

  function next() {
    fn = fns[i++];

    if (!fn) {
      if (done) done();
      return;
    }

    if (2 == fn.length) {
      fn(val, handle);
    } else {
      if (false === fn(val))
        done(new Error('haulted'));
      else
        next();
    }
  }

  next();
}
});
require.register("tower-model/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , stream = require('tower-stream')
  , validator = require('tower-validator').ns('model')
  , load = require('tower-load')
  , proto = require('./lib/proto')
  , statics = require('./lib/static')
  , slice = [].slice;

/**
 * Expose `model`.
 */

exports = module.exports = model;

/**
 * Expose `collection`
 */

exports.collection = [];

/**
 * Expose `validator`.
 */

exports.validator = validator;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function model(name) {
  if (exports.collection[name]) return exports.collection[name];
  if (exports.load(name)) return exports.collection[name];

  /**
   * Initialize a new model with the given `attrs`.
   *
   * @param {Object} attrs
   * @api public
   */

  function Model(attrs) {
    attrs || (attrs = {});

    this.attrs = attrs;
    this.dirty = attrs;
    this._callbacks = {};
    Model.emit('init', this);
    // XXX: need function binding component
    // https://github.com/component/bind/blob/master/index.js
    // but that is inefficient.
    // this.action = this.action.bind(this);
  }

  Model.toString = function toString(){
    return 'model("' + name + '")';
  }

  // statics

  Model.className = name;
  Model.attrs = [];
  Model.validators = [];
  Model.prototypes = [];
  Model.relations = [];
  Model._callbacks = {};
  // starting off context
  Model.context = Model;

  for (var key in statics) Model[key] = statics[key];

  // prototype

  Model.prototype = {};
  Model.prototype.constructor = Model;
  
  for (var key in proto) Model.prototype[key] = proto[key];

  // XXX: remove def from ./lib/static
  Model.action = stream.ns(name);

  exports.collection[name] = Model;
  exports.collection.push(Model);
  exports.emit('define', Model);
  exports.emit('define ' + name, Model);

  return Model;
}

/**
 * Mixins.
 */

exports.use = function(obj){
  if ('function' === typeof obj) {
    obj.call(exports, statics, proto, exports);
  } else {
    for (var key in obj) statics[key] = obj[key]
  }
}

/**
 * Lazy-load stuff for a particular constructor.
 *
 * Example:
 *
 *    model.load('user', require.resolve('./lib/user'));
 *
 * @param {String} name
 * @param {String} path
 */

exports.load = function(name, path){
  return 1 === arguments.length
    ? load(exports, name)
    : load.apply(load, [exports].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Create a `model` function that
 * just prepends a namespace to every key.
 *
 * This is used to make the DSL simpler,
 * check out the `tower-adapter` code for an example.
 */

exports.ns = function(ns){
  function model(name) {
    return exports(ns + '.' + name);
  }

  // XXX: copy functions?
  for (var key in exports) {
    if ('function' === typeof exports[key])
      model[key] = exports[key];
  }
  return model;
}

/**
 * Mixin `Emitter`.
 */

Emitter(model);
Emitter(statics);
Emitter(proto);

/**
 * Clear models.
 */

exports.clear = function(){
  exports.collection.forEach(function(emitter){
    emitter.off('define');
    delete exports.collection[emitter.className];
  });

  exports.collection.length = 0;

  return exports;
}
});
require.register("tower-model/lib/static.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var attr = require('tower-attr')
  , validator = require('tower-validator').ns('model')
  , text = require('tower-inflector') // XXX: rename `tower-text`?
  , query = require('tower-query')
  , series = require('part-async-series');

text('model.error', 'Model validation failed');

/**
 * Instantiate a new `Model`.
 *
 * @param {Object} attrs
 * @return {Object} instance
 */

exports.init = function(attrs){
  return new this(attrs);
}

/**
 * Use the given plugin `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.use = function(fn){
  fn(this);
  return this;
};

/**
 * Add validation `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.validate = function(key, val){
  // XXX: add validator to validate attributes.
  if (!this.validators.attrs && this !== this.context) {
    var self = this;
    this.validators.attrs = true;
    this.validator(function validateAttributes(obj, fn){
      var validators = [];

      self.attrs.forEach(function(attr){
        if (attr.validators && attr.validators.length) {
          validators.push(function validate(obj){
            attr.validate(obj);
          });
        }
      });

      series(validators, obj, fn);
    });
  }
  
  if ('function' === typeof key)
    this.validator(key);
  else
    this.context.validator(key, val);

  return this;
};

exports.validator = function(key, val){
  if ('function' === typeof key) {
    // XXX: needs to handle pushing errors.
    this.validators.push(key);
  } else {
    var assert = validator(key);
    // XXX: should be set somewhere earlier.
    var path = this.path || 'model.' + this.className + '.' + key;

    this.validators.push(function validate(obj, fn){
      if (!assert(obj, val)) {
        // XXX: hook into `tower-inflector` for I18n
        var error = text.has(path)
          ? text(path).render(obj)
          : text('model.error').render(obj);

        obj.errors[attr.name] = error;
        obj.errors.push(error);
      }
    });
  }
  return this;
}

/**
 * Define an `id`.
 *
 * @param {String} name
 * @param {Object} options
 * @return {Function} self
 */

exports.id = function(name, options){
  options || (options = {});
  options.primary = true;
  return this.attr(name || 'id', options);
}

/**
 * Define attr with the given `name` and `options`.
 *
 * @param {String} name
 * @param {Object} options
 * @return {Function} self
 * @api public
 */

exports.attr = function(name, type, options){
  var obj = this.context = attr(name, type, options);

  // set?
  this.attrs[name] = obj;
  this.attrs.push(obj);

  // implied pk
  if ('_id' === name || 'id' === name) {
    options.primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  this.prototype[name] = function(val){
    if (0 === arguments.length) {
      if (undefined === this.attrs[name] && obj.hasOwnProperty('value'))
        // XXX: handle cloning (for arrays/objects) and functions.
        return this.attrs[name] = obj.value;
      else
        return this.attrs[name];
    }

    var prev = this.attrs[name];
    this.dirty[name] = val;
    this.attrs[name] = val;
    this.constructor.emit('change ' + name, this, val, prev);
    this.emit('change ' + name, val, prev);
    return this;
  };

  return this;
};

/**
 * Insert/POST/create a new record.
 *
 * @param {Object} [attrs]
 * @param {Function} [fn]
 * @return {Topology} A stream object
 */

exports.create = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.init(attrs).save(fn);
}

exports.save = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.init(attrs).save(fn);
}

exports.query = function(name){
  return null == name
    ? query().start(this.className)
    // XXX: this should only happen first time.
    : query(this.className + '.' + name).start(this.className);
}

exports.find = function(fn){
  return this.query().find(fn);
}

/**
 * Remove all records of this type.
 *
 * @param {Function} fn
 */

exports.remove = function(fn){
  return this.query().remove(fn);
}

/**
 * Begin defining a query.
 *
 * @param {String} key Attribute path
 */

exports.where = function(key){
  return this.query().where(key);
}

/**
 * XXX: Load data into store.
 */

exports.load = function(data){
  // XXX require('tower-memory-adapter').load(data);
}
});
require.register("tower-model/lib/proto.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var query = require('tower-query')
  , each = require('part-async-series');

/**
 * Check if this model is new.
 *
 * @return {Boolean}
 * @api public
 */

exports.isNew = function(){
  var key = this.constructor.primaryKey;
  return !this.has(key);
};

/**
 * Save and invoke `fn(err)`.
 *
 * Events:
 *
 *  - `save` on updates and saves
 *  - `saving` pre-update or save, after validation
 *
 * @param {Function} [fn]
 * @api public
 */

exports.save = function(fn){
  var self = this;
  this.constructor.emit('saving', this);
  this.emit('saving');
  // XXX: this itself should probably be
  //      bundled into a topology/stream/action.
  this.validate(function(err){
    if (err) {
      fn(err);
    } else {
      query()
        .start(self.constructor.className)
        .create(self, function(){
          self.dirty = {};
          self.constructor.emit('save', self);
          self.emit('save');
          if (fn) fn();
        });
    }
  });
};

/**
 * Update and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api private
 */

exports.update = function(fn){
  return query.action('update', this).exec(fn);
};

/**
 * Remove the model and mark it as `.removed`
 * and invoke `fn(err)`.
 *
 * Events:
 *
 *  - `removing` before deletion
 *  - `remove` on deletion
 *
 * @param {Function} [fn]
 * @api public
 */

exports.remove = function(fn){
  return query().action('remove', this).exec(fn);
};

/**
 * Validate the model and return a boolean.
 */

exports.isValid = function(fn){
  this.validate(fn);
  return 0 === this.errors.length;
};

/**
 * Perform validations.
 *
 * @api private
 */

exports.validate = function(fn){
  var self = this;
  this.errors = [];
  this.emit('validating', this);
  // XXX: need single `validateAttributes`
  // XXX: need to store validators by key.
  each(this.constructor.validators, this, function(){
    // self.emit('after-validate', self);
    // self.emit('validated', self);
    self.emit('validate', self);

    if (fn) {
      if (self.errors.length)
        fn(new Error('Validation Error'));
      else
        fn(); 
    }
  });
  return 0 === this.errors.length;
};

/**
 * Set multiple `attrs`.
 *
 * @param {Object} attrs
 * @return {Object} self
 * @api public
 */

exports.set = function(){
  if ('string' === typeof attrs)
    return this[arguments[0]](arguments[1]);

  for (var key in attrs) {
    this[key](attrs[key]);
  }

  return this;
};

/**
 * Get `attr` value.
 *
 * @param {String} attr
 * @return {Mixed}
 * @api public
 */

exports.get = function(attr){
  return this.attrs[attr];
};

/**
 * Check if `attr` is present (not `null` or `undefined`).
 *
 * @param {String} attr
 * @return {Boolean}
 * @api public
 */

exports.has = function(attr){
  return null != this.attrs[attr];
};

/**
 * Return the JSON representation of the model.
 *
 * @return {Object}
 * @api public
 */

exports.toJSON = function(){
  return this.attrs;
};
});
require.alias("tower-emitter/index.js", "tower-model/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-model/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-stream/index.js", "tower-model/deps/tower-stream/index.js");
require.alias("tower-stream/lib/static.js", "tower-model/deps/tower-stream/lib/static.js");
require.alias("tower-stream/lib/proto.js", "tower-model/deps/tower-stream/lib/proto.js");
require.alias("tower-stream/lib/api.js", "tower-model/deps/tower-stream/lib/api.js");
require.alias("tower-stream/index.js", "tower-model/deps/tower-stream/index.js");
require.alias("tower-emitter/index.js", "tower-stream/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-stream/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-param/index.js", "tower-stream/deps/tower-param/index.js");
require.alias("tower-param/lib/validators.js", "tower-stream/deps/tower-param/lib/validators.js");
require.alias("tower-emitter/index.js", "tower-param/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-param/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-param/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-param/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-param/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("tower-type/index.js", "tower-param/deps/tower-type/index.js");
require.alias("tower-type/lib/types.js", "tower-param/deps/tower-type/lib/types.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-type/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("part-is-array/index.js", "tower-type/deps/part-is-array/index.js");

require.alias("part-is-array/index.js", "tower-param/deps/part-is-array/index.js");

require.alias("tower-attr/index.js", "tower-stream/deps/tower-attr/index.js");
require.alias("tower-attr/lib/validators.js", "tower-stream/deps/tower-attr/lib/validators.js");
require.alias("tower-validator/index.js", "tower-attr/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-attr/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-attr/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("tower-emitter/index.js", "tower-attr/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-attr/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-inflector/index.js", "tower-attr/deps/tower-inflector/index.js");
require.alias("tower-inflector/index.js", "tower-attr/deps/tower-inflector/index.js");
require.alias("component-assert/index.js", "tower-inflector/deps/assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("tower-inflector/index.js", "tower-inflector/index.js");

require.alias("tower-type/index.js", "tower-attr/deps/tower-type/index.js");
require.alias("tower-type/lib/types.js", "tower-attr/deps/tower-type/lib/types.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-type/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("part-is-array/index.js", "tower-type/deps/part-is-array/index.js");

require.alias("tower-load/index.js", "tower-stream/deps/tower-load/index.js");

require.alias("tower-stream/index.js", "tower-stream/index.js");

require.alias("tower-query/index.js", "tower-model/deps/tower-query/index.js");
require.alias("tower-query/lib/constraint.js", "tower-model/deps/tower-query/lib/constraint.js");
require.alias("part-each-array/index.js", "tower-query/deps/part-each-array/index.js");

require.alias("part-is-array/index.js", "tower-query/deps/part-is-array/index.js");

require.alias("tower-attr/index.js", "tower-model/deps/tower-attr/index.js");
require.alias("tower-attr/lib/validators.js", "tower-model/deps/tower-attr/lib/validators.js");
require.alias("tower-validator/index.js", "tower-attr/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-attr/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-attr/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("tower-emitter/index.js", "tower-attr/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-attr/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-inflector/index.js", "tower-attr/deps/tower-inflector/index.js");
require.alias("tower-inflector/index.js", "tower-attr/deps/tower-inflector/index.js");
require.alias("component-assert/index.js", "tower-inflector/deps/assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("tower-inflector/index.js", "tower-inflector/index.js");

require.alias("tower-type/index.js", "tower-attr/deps/tower-type/index.js");
require.alias("tower-type/lib/types.js", "tower-attr/deps/tower-type/lib/types.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-type/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-type/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-type/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("part-is-array/index.js", "tower-type/deps/part-is-array/index.js");

require.alias("tower-validator/index.js", "tower-model/deps/tower-validator/index.js");
require.alias("tower-validator/lib/validators.js", "tower-model/deps/tower-validator/lib/validators.js");
require.alias("tower-validator/index.js", "tower-model/deps/tower-validator/index.js");
require.alias("component-indexof/index.js", "tower-validator/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("tower-emitter/index.js", "tower-validator/deps/tower-emitter/index.js");
require.alias("component-indexof/index.js", "tower-emitter/deps/indexof/index.js");

require.alias("tower-emitter/index.js", "tower-emitter/index.js");

require.alias("tower-validator/index.js", "tower-validator/index.js");

require.alias("tower-inflector/index.js", "tower-model/deps/tower-inflector/index.js");
require.alias("tower-inflector/index.js", "tower-model/deps/tower-inflector/index.js");
require.alias("component-assert/index.js", "tower-inflector/deps/assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("tower-inflector/index.js", "tower-inflector/index.js");

require.alias("tower-load/index.js", "tower-model/deps/tower-load/index.js");

require.alias("part-async-series/index.js", "tower-model/deps/part-async-series/index.js");

require.alias("tower-model/index.js", "tower-model/index.js");

