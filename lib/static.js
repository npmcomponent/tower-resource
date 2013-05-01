
/**
 * Module dependencies.
 */

var Attr = require('tower-attr')
  , query = require('tower-query')
  , stream = require('tower-stream')
  , noop = function(){}
  , context = {}
  , slice = [].slice;

/**
 * Add validation `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.validate = function(fn){
  this.validators.push(fn);
  return this;
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
 * TODO
 */

exports.load = function(data){

}

exports.action = function(name, options){
  stream(this.className + '.' + name, options);
  return this;
}

exports.id = function(name, options){
  options || (options = {});
  options.primary = true;
  return this.attr(name, options);
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

exports.val = function(value){
  if (isArray(value)) {
    context.field.defaultValue = function(){
      return value.concat();
    }
  } else {
    context.field.defaultValue = function(){
      return value;
    }
  }

  return this;
}

exports.create = function(attrs){
  return new this(attrs);
}

exports.save = function(attrs, fn){
  if ('function' === typeof attrs) {
    fn = attrs;
    attrs = undefined;
  }
  return this.create(attrs).save(fn);
}

exports.insert = exports.save;

exports.query = function(fn){
  if ('string' === typeof fn) {
    return query(this.className + '.' + fn)
      .start(this.className);
  } else {
    return query()
      .start(this.className)
      .action('query')
      .execute(fn); 
  }
}