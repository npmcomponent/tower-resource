
/**
 * Module dependencies.
 */

var Attr = require('tower-attr')
  , query = require('tower-query')
  , series = require('part-async-series');

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
  this.context.validator(key, val);
  return this;
};

exports.validator = function(fn){
  this.validators.push(fn);
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
  var attr = this.context = new Attr(name, type, options);

  // set?
  this.attrs[name] = attr;
  this.attrs.push(attr);

  // implied pk
  if ('_id' === name || 'id' === name) {
    options.primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  this.prototype[name] = function(val){
    if (0 === arguments.length) {
      if (undefined === this.attrs[name] && attr.defaultValue)
        return this.attrs[name] = attr.defaultValue();
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