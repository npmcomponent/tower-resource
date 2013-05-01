
/**
 * Module dependencies.
 */

var Attr = require('tower-attr')
  , query = require('tower-query');

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
  this.context.validator(key, val);
  return this;
};

exports.validator = function(fn){
  // XXX: just a function in this case, but could handle more.
  this.validators.push(fn);
  return this;
}

/**
 * Require an attribute.
 *
 * This is a special case of a property validator.
 */

exports.required = function(){
  var name = this.context.name;
  return this.validator(function required(){
    // XXX
  });
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
  var attr = new Attr(name, type, options);

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

exports.query = function(fn){
  if ('string' === typeof fn) {
    return query(this.className + '.' + fn)
      .start(this.className);
  } else {
    return query()
      .start(this.className)
      .action('find')
      .exec(fn);
  }
}

/**
 * Remove all records of this type.
 *
 * @param {Function} fn
 */

exports.remove = function(fn){
  return query().start(this.className).remove(fn);
}

/**
 * Begin defining a query.
 *
 * @param {String} key Attribute path
 */

exports.where = function(key){
  return query().start(this.className).where(key);
}

/**
 * XXX: Load data into store.
 */

exports.load = function(data){

}