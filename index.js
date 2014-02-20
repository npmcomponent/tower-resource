
/**
 * Module dependencies.
 */

// commented out by npm-component: var Emitter = require('tower-emitter');
// commented out by npm-component: var stream = require('tower-stream');
var validator = require('tower-validator').ns('resource');
// commented out by npm-component: var load = require('tower-load');
var proto = require('./lib/proto');
var statics = require('./lib/static');
var slice = [].slice;

/**
 * Expose `resource`.
 */

exports = module.exports = resource;

/**
 * Expose `collection`
 */

exports.collection = [];

/**
 * Expose `validator`.
 */

exports.validator = validator;

/**
 * Create a new resource constructor with the given `name`.
 *
 * @param {String} name Resource name.
 * @return {Function} The `Resource` class constructor.
 * @api public
 */

function resource(name) {
  if (exports.collection[name]) return exports.collection[name];
  if (exports.load(name)) return exports.collection[name];

  /**
   * Initialize a new resource with the given `attrs`.
   *
   * @class
   * @param {Object} attrs An object with attributes.
   * @param {Boolean} storedAttrs Attributes that should not be dirtied.
   * @api public
   */

  function Resource(attrs, storedAttrs) {
    // XXX: if storedAttrs, don't set to dirty
    this.attrs = {};
    this.dirty = {};
    this._callbacks = {};
    attrs = Resource._defaultAttrs(attrs, this);

    for (var key in attrs) {
      if (attrs.hasOwnProperty(key))
        this.set(key, attrs[key], true);
    }

    Resource.emit('init', this);
  }

  Resource.toString = function toString(){
    return 'resource("' + name + '")';
  }

  // statics

  Resource.className = name;
  Resource.id = name;
  Resource.attrs = [];
  // optimization
  Resource.attrs.__default__ = {};
  Resource.validators = [];
  Resource.prototypes = [];
  Resource.relations = [];
  Resource._callbacks = {};
  // starting off context
  Resource.context = Resource;

  for (var key in statics) Resource[key] = statics[key];

  // prototype

  Resource.prototype = {};
  Resource.prototype.constructor = Resource;
  
  for (var key in proto) Resource.prototype[key] = proto[key];

  Resource.action = stream.ns(name);
  Resource.id();

  exports.collection[name] = Resource;
  exports.collection.push(Resource);
  exports.emit('define', Resource);
  exports.emit('define ' + name, Resource);

  return Resource;
}

/**
 * Mixin `Emitter`.
 */

Emitter(resource);
Emitter(statics);
Emitter(proto);

/**
 * Mixins.
 */

exports.use = function(obj){
  if ('function' === typeof obj) {
    obj.call(exports, statics, proto, exports);
  } else {
    for (var key in obj) statics[key] = obj[key]
  }
};

/**
 * Lazy-load stuff for a particular constructor.
 *
 * Example:
 *
 *    resource.load('user', require.resolve('./lib/user'));
 *
 * @param {String} name Resource name.
 * @param {String} path Resource path.
 * @api public
 */

exports.load = function(name, path){
  return 1 === arguments.length
    ? load(exports, name)
    : load.apply(load, [exports].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Create a `resource` function that
 * just prepends a namespace to every key.
 *
 * This is used to make the DSL simpler,
 * check out the `tower-adapter` code for an example.
 *
 * @param {String} ns The namespace.
 * @return {Resource} The resource.
 * @api public
 */

exports.ns = function(ns){
  function resource(name) {
    return exports(ns + '.' + name);
  }

  // XXX: copy functions?
  for (var key in exports) {
    if ('function' === typeof exports[key])
      resource[key] = exports[key];
  }
  return resource;
};

/**
 * Check object is a `Resource` object.
 * XXX: maybe remove "resource('name')" as toString.
 *
 * @param {Object} obj A JavaScript object.
 * @return {Boolean} true if obj is a `Resource` object, otherwise false.
 * @api public
 */

exports.is = function(obj){
  return obj && obj.constructor.toString().indexOf('resource(') === 0;
};

/**
 * Clear resources.
 *
 * @return {Function} exports The main `resource` function.
 * @api public
 */

exports.clear = function(){
  exports.collection.forEach(function(emitter){
    emitter.off('define');
    delete exports.collection[emitter.className];
  });

  exports.collection.length = 0;

  return exports;
};