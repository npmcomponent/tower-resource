
/**
 * Module dependencies.
 */

var Emitter = 'undefined' == typeof window ? require('emitter-component') : require('emitter')
  //, adapter = require('tower-adapter')
  //, graph = require('tower-graph') // graph and topology
  , noop = function(){};

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Check if this model is new.
 *
 * @return {Boolean}
 * @api public
 */

exports.isNew = function(){
  var key = this.model.primaryKey;
  return ! this.has(key);
};

/**
 * Destroy the model and mark it as `.removed`
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
  graph.remove(this, fn || noop);
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
  graph.save(this, fn || noop);
};

/**
 * Update and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api private
 */

exports.update = function(fn){
  graph.remove(this, fn || noop);
};

/**
 * The adapter instance.
 */

exports.adapter = function(){
  return adapter(this.constructor.adapterName || 'memory');
}

/**
 * Set multiple `attrs`.
 *
 * @param {Object} attrs
 * @return {Object} self
 * @api public
 */

exports.set = function(){
  if ('string' == typeof attrs)
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
