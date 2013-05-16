
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

  function Model(attrs, storedAttrs) {
    // XXX: if storedAttrs, don't set to dirty
    this.attrs = {};
    this.dirty = {};
    this._callbacks = {};
    attrs = Model._defaultAttrs(attrs, this);

    for (var key in attrs) this.set(key, attrs[key], true);

    Model.emit('init', this);
  }

  Model.toString = function toString(){
    return 'model("' + name + '")';
  }

  // statics

  Model.className = name;
  Model.id = name;
  Model.attrs = [];
  // optimization
  Model.attrs.__default__ = {};
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
};

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
};

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
};

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
};