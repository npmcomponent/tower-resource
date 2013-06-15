
/**
 * Module dependencies.
 */

var attr = require('tower-attr'); // XXX needs something like this: .ns('resource')
var validator = require('tower-validator').ns('resource');
var text = require('tower-text'); // XXX: rename `tower-text`?
var query = require('tower-query');
var series = require('part-async-series');

text('resource.error', 'Resource validation failed');

/**
 * Instantiate a new `Resource`.
 *
 * @constructor Resource
 * @param {Object} attrs Resource attributes.
 * @param {Boolean} storedAttrs Boolean to enable caching attributes.
 * @return {Object} instance.
 */

exports.init = function(attrs, storedAttrs){
  return new this(attrs, storedAttrs);
};

/**
 * Use the given plugin `fn()`.
 *
 * @constructor Resource
 * @chainable
 * @param {Function} fn Plugin function.
 * @return {Function} exports The main `resource` function.
 * @api public
 */

exports.use = function(fn){
  fn(this);
  return this;
};

/**
 * Add validation `fn()`.
 *
 * @constructor Resource
 * @chainable
 * @param {Function} fn Validation function.
 * @return {Function} exports The main `resource` function.
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

/**
 * Add a validation function to a list of validators.
 *
 * @constructor Resource
 * @chainable
 * @param key Resource property.
 * @param val Resource property value.
 * @return {Function} exports The main `resource` function.
 * @api public
 */

exports.validator = function(key, val){
  if ('function' === typeof key) {
    // XXX: needs to handle pushing errors.
    this.validators.push(key);
  } else {
    var assert = validator(key);
    // XXX: should be set somewhere earlier.
    var path = this.path || 'resource.' + this.className + '.' + key;

    this.validators.push(function validate(obj, fn){
      if (!assert(obj, val)) {
        // XXX: hook into `tower-text` for I18n
        var error = text.has(path)
          ? text(path).render(obj)
          : text('resource.error').render(obj);

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
 * @constructor Resource
 * @chainable
 * @param {String} name
 * @param {Object} options
 * @return {Function} exports The main `resource` function.
 * @api public
 */

exports.id = function(name, type, options){
  options || (options = {});
  return this.attr(name || 'id', type || 'id', options);
};

/**
 * Define attr with the given `name` and `options`.
 *
 * @constructor Resource
 * @chainable
 * @param {String} name
 * @param {Object} options
 * @return {Function} exports The main `resource` function.
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
 * @constructor Resource
 * @param {Object} attrs Initial record attribute values.
 * @param {Function} fn Function called on record creation.
 * @return {Topology} A stream object.
 * @api public
 */

exports.create = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.init(attrs).save(fn);
};

/**
 * Save/PUT/update an existing record.
 *
 * @constructor Resource
 * @param {Object} attrs Record attribute values to be updated to.
 * @param {Function} fn Function called on record update.
 * @return {Topology} A stream object.
 * @api public
 */

exports.save = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.init(attrs).save(fn);
};

/**
 * Make a SELECT query on className and name.
 *
 * @param {String} name An appended namespace.
 * @return {Query} Query object containing query results.
 * @api public
 */

exports.query = function(name){
  return null == name
    ? query().select(this.className)
    // XXX: this should only happen first time.
    : query(this.className + '.' + name).select(this.className);
};

/**
 * Execute find query with `fn`.
 *
 * @constructor Resource
 * @param {Function} fn Function executed on query `find` call.
 * @return {Query} Query object containing query results.
 */

exports.find = function(fn){
  return this.query().find(fn);
};

/**
 * Remove all records of this type.
 *
 * @constructor Resource
 * @param {Function} fn Function executed on query `remove` call.
 * @return {Query} Query object containing query results.
 * @api public
 */

exports.remove = function(fn){
  return this.query().remove(fn);
};

/**
 * Updates a list of records.
 *
 * @constructor Resource
 * @param {Array} updates List of record attributes to update.
 * @param {Function} fn Function executed on record update.
 * @api public
 */

exports.update = function(updates, fn){
  return this.query().update(updates, fn);
};

/**
 * Begin defining a query.
 *
 * @constructor Resource
 * @param {String} key Attribute path
 * @return {Query} Query object.
 * @api public
 */

exports.where = function(key){
  return this.query().where(key);
};

/**
 * Get all records.
 *
 * @constructor Resource
 * @param {Function} fn Function executed on query `all` call.
 * @return {Query} Query object containing query results.
 */

exports.all = function(fn){
  return this.query().all(fn);
};

/**
 * XXX: Load data into store.
 *
 * @constructor Resource
 * @param {Object} Data to load into store.
 */

exports.load = function(data){
  // XXX require('tower-memory-adapter').load(data);
};

/**
 * Returns the default model attributes with their values.
 *
 * @constructor Resource
 * @return {Object} The default model attributes with their values.
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