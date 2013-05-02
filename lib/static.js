
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
      if (undefined === this.attrs[name] && obj.defaultValue)
        return this.attrs[name] = obj.defaultValue();
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
    : query(name);
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

}