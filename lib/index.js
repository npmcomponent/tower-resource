
/**
 * Module dependencies.
 */

var proto = require('./proto')
  , statics = require('./static')
  , Emitter = require('emitter-component')
  , container = require('tower-container');

/**
 * Expose `createModel`.
 */

module.exports = createModel;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function createModel(name) {
  if ('string' != typeof name) throw new TypeError('model name required');

  var cached = container.get('model:' + name);

  if (cached) return cached;

  /**
   * Initialize a new model with the given `attrs`.
   *
   * @param {Object} attrs
   * @api public
   */

  function model(attrs) {
    if (!(this instanceof model)) return new model(attrs);
    attrs = attrs || {};

    this.attrs = attrs;
    this.dirty = attrs;
    this.container = container;
  }

  // mixin emitter

  Emitter(model);

  // statics

  model.className = name;
  model.attrs = [];
  model.validators = [];
  model.prototypes = [];

  for (var key in statics) model[key] = statics[key];

  // prototype

  model.prototype = {};
  model.prototype.model = model;
  
  for (var key in proto) model.prototype[key] = proto[key];

  container.set('model:' + name, model);

  return model;
}

Emitter(createModel);
