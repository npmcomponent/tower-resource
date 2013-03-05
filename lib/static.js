
/**
 * Module dependencies.
 */

var noop = function(){}
  , _ = require('underscore')
  , each = _.each
  , context = {}
  , slice = [].slice
  , isArray = _.isArray
  , indexOf = _.indexOf;

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
 * XXX: todo
 */

exports.load = function(data){

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
  options.name = name;

  this.attrs.push(options);

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

exports.adapter = function(name){
  this.adapterName = name;
  return this;
}

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

exports.inherits = function(){
  var types = this.types;

  each(slice.call(arguments), function(x) {
    if (indexOf(types, x) === -1) types.push(x);
  });

  return this;
}
