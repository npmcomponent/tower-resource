
/**
 * Module dependencies.
 */

var query = require('tower-query')
  , each = require('part-async-series');

/**
 * Check if this model is new.
 *
 * @return {Boolean}
 * @api public
 */

exports.isNew = function(){
  var key = this.constructor.primaryKey;
  return !this.has(key);
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
  var self = this;
  this.constructor.emit('saving', this);
  this.emit('saving');
  // XXX: needs to somehow set default properties
  // XXX: this itself should probably be
  //      bundled into a topology/stream/action.
  this.validate(function(err){
    if (err) {
      fn(err);
    } else {
      query()
        .select(self.constructor.className)
        .create(self, function(){
          self.dirty = {};
          self.constructor.emit('save', self);
          self.emit('save');
          if (fn) fn(null, self);
        });
    }
  });
};

/**
 * Update and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api private
 */

exports.update = function(fn){
  return query()
    .select(this.constructor.className)
    .action('update', this).exec(fn);
};

/**
 * Remove the model and mark it as `.removed`
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
  return query()
    .select(this.constructor.className)
    .action('remove', this).exec(fn);
};

/**
 * Validate the model and return a boolean.
 */

exports.isValid = function(fn){
  this.validate(fn);
  return 0 === this.errors.length;
};

/**
 * Perform validations.
 *
 * @api private
 */

exports.validate = function(fn){
  var self = this;
  this.errors = [];
  this.emit('validating', this);
  // XXX: need single `validateAttributes`
  // XXX: need to store validators by key.
  each(this.constructor.validators, this, function(){
    // self.emit('after-validate', self);
    // self.emit('validated', self);
    self.emit('validate', self);

    if (fn) {
      if (self.errors.length)
        fn(new Error('Validation Error'));
      else
        fn(); 
    }
  });
  return 0 === this.errors.length;
};

/**
 * Set attribute value.
 *
 * @param {String} name
 * @param {Mixed} val
 * @param {Boolean} quiet If true, won't dispatch change events.
 * @return {Object} self
 * @api public
 */

exports.set = function(name, val, quiet){
  var attr = this.constructor.attrs[name];
  if (!attr) return; // XXX: throw some error, or dynamic property flag?
  if (undefined === val && attr.hasDefaultValue)
    val = attr.apply(this);
  val = attr.typecast(val);
  var prev = this.attrs[name];
  this.dirty[name] = val;
  this.attrs[name] = val;

  // XXX: this `quiet` functionality could probably be implemented
  //   in a less ad-hoc way. It is currently only used when setting
  //   properties passed in through `init`, such as from a db/adapter
  //   serializing data into a model, doesn't need to dispatch changes.
  if (!quiet) {
    this.constructor.emit('change ' + name, this, val, prev);
    this.emit('change ' + name, val, prev); 
  }
  return this;
};

/**
 * Get `name` value.
 *
 * @param {String} name
 * @return {Mixed}
 * @api public
 */

exports.get = function(name){
  // XXX: need a better way to do this
  if ('id' === name && this.__id___) return this.__id__;
  if (undefined === this.attrs[name]) {
    var attr = this.defaultAttr(name)
    if (attr)
      return this.attrs[name] = attr.apply(this);
  } else {
    return this.attrs[name];
  }
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

/**
 * Returns `Attr` definition if it has a default value.
 *
 * @param {String} name
 * @api private
 */

exports.defaultAttr = function(name){
  var defaultAttrs = this.constructor.attrs.__default__;
  return defaultAttrs.hasOwnProperty(name) && defaultAttrs[name];
};