
/**
 * Module dependencies.
 */

var noop = function(){}
  , context = {}
  , slice = [].slice
  , stream = require('tower-stream');

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

exports.attr = function(name, options){
  options || (options = {});
  options.type || (options.type = 'string');
  options.name = name;

  // set?
  this.attrs.push(options);
  this.attrs[options.name] = options;

  // implied pk
  if ('_id' == name || 'id' == name) {
    options.primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  this.prototype[name] = function(val){
    if (0 == arguments.length) return this.attrs[name];
    var prev = this.attrs[name];
    this.dirty[name] = val;
    this.attrs[name] = val;
    this.model.emit('change ' + name, this, val, prev);
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

exports.insert = function(attrs){
  return this.create(attrs).insert();
}