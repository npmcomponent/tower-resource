
/**
 * Module dependencies.
 */

var proto = require('./lib/proto')
  , statics = require('./lib/static')
  , Emitter = require('tower-emitter')
  , stream = require('tower-stream')
  , slice = [].slice;

/**
 * Expose `model`.
 */

exports = module.exports = model;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function model(name) {
  if (constructors[name]) return constructors[name];

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

  constructors[name] = Model;
  constructors.push(Model);
  exports.emit('define ' + name, Model);
  exports.emit('define', Model);

  return Model;
}

/**
 * Model classes.
 */

var constructors = exports.constructors = [];

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
  // extra args, eg. `model.load('user', path, adapter);`
  var args = slice.call(arguments, 2);

  exports.on('define ' + name, function(x){
    var result = require(path);
    
    if ('function' === typeof result) {
      args.unshift(x);
      result.apply(result, args);
    }

    args = undefined;
  });

  return exports;
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
  constructors.forEach(function(emitter){
    emitter.off('define');
    delete constructors[emitter.className];
  });

  constructors.length = 0;

  return exports;
}