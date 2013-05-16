
/**
 * Module dependencies.
 */

var attr = require('tower-attr')// XXX needs something like this: .ns('model')
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

exports.init = function(attrs, storedAttrs){
  return new this(attrs, storedAttrs);
};

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
};

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
};

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
  // XXX: needs to be something like this:
  // var obj = this.context = attr(this.id + '.' + name, type, options);

  // set?
  this.attrs[name] = obj;
  this.attrs.push(obj);
  // optimization
  if (obj.hasDefaultValue)
    this.attrs.__default__[name] = obj;

  // implied pk
  if ('id' === name) {
    options.primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  accessor(this.prototype, name);

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
};

exports.save = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.init(attrs).save(fn);
};

exports.query = function(name){
  return null == name
    ? query().select(this.className)
    // XXX: this should only happen first time.
    : query(this.className + '.' + name).select(this.className);
};

exports.find = function(fn){
  return this.query().find(fn);
};

/**
 * Remove all records of this type.
 *
 * @param {Function} fn
 */

exports.remove = function(fn){
  return this.query().remove(fn);
};

/**
 * Begin defining a query.
 *
 * @param {String} key Attribute path
 */

exports.where = function(key){
  return this.query().where(key);
};

exports.all = function(fn){
  return this.query().all(fn);
};

/**
 * XXX: Load data into store.
 */

exports.load = function(data){
  // XXX require('tower-memory-adapter').load(data);
};

/**
 * @api private
 */

exports._defaultAttrs = function(attrs, binding){
  // XXX: this can be optimized further.
  var defaultAttrs = this.attrs.__default__;
  attrs || (attrs = {});
  for (var name in defaultAttrs) {
    if (undefined === attrs[name])
      attrs[name] = defaultAttrs[name].apply(binding);
  }
  return attrs;
};

function accessor(proto, name) {
  // XXX: should probably check if method is already defined.
  proto[name] = function(val){
    return 0 === arguments.length
      ? this.get(name)
      : this.set(name, val);
  };
}