
/**
 * Module dependencies.
 */

var proto = require('./lib/proto')
  , statics = require('./lib/static')
  , Emitter = 'undefined' == typeof window ? require('emitter-component') : require('emitter');

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
  if (models[name]) return models[name];

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

  for (var key in statics) Model[key] = statics[key];

  // prototype

  Model.prototype = {};
  Model.prototype.constructor = Model;
  
  for (var key in proto) Model.prototype[key] = proto[key];

  models[name] = Model;
  models.push(Model);
  model.emit('define', Model);

  return Model;
}

/**
 * Model classes.
 */

var models = exports.models = [];

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
 * Mixin `Emitter`.
 */

Emitter(model);
Emitter(statics);
Emitter(proto);