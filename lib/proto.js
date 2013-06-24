
/**
 * Module dependencies.
 */

var query = require('tower-query');
var each = require('part-async-series');

/**
 * Check if this resource is new.
 *
 * @constructor Resource
 * @return {Boolean} true if resource is new, else false.
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
 * @constructor Resource
 * @param {Function} fn Function invoked on resource creation.
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
 * @constructor Resource
 * @param {Function} fn Function executed on resource update.
 * @return {Mixed} fn return value.
 * @api private
 */

exports.update = function(fn){
  return query()
    .select(this.constructor.className)
    .action('update', this).exec(fn);
};

/**
 * Remove the resource and mark it as `.removed`
 * and invoke `fn(err)`.
 *
 * Events:
 *
 *  - `removing` before deletion
 *  - `remove` on deletion
 *
 * @constructor Resource
 * @param {Function} fn Function executed on resource removal.
 * @return {Mixed} fn return value.
 * @api public
 */

exports.remove = function(fn){
  return query()
    .select(this.constructor.className)
    .where('id').eq(this.get('id'))
    .action('remove').exec(fn);
};

/**
 * Validate the resource and return a boolean.
 *
 * @constructor Resource
 * @param {Function} fn Validation function.
 * @return {Boolean} true if there were errors, else false.
 * @api public
 */

exports.isValid = function(fn){
  this.validate(fn);
  return 0 === this.errors.length;
};

/**
 * Perform validations.
 *
 * @constructor Resource
 * @param {Function} fn Validation function.
 * @return {Boolean} true if there were errors, else false.
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
 * @constructor Resource
 * @chainable
 * @param {String} name Attribute name.
 * @param {Mixed} val Attribute value.
 * @param {Boolean} quiet If true, won't dispatch change events.
 * @return {Resource}
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
  //   serializing data into a resource, doesn't need to dispatch changes.
  if (!quiet) {
    this.constructor.emit('change ' + name, this, val, prev);
    this.emit('change ' + name, val, prev); 
  }
  return this;
};

/**
 * Get `name` value.
 *
 * @constructor Resource
 * @param {String} name Attribute name.
 * @return {Mixed} Attribute value.
 * @api public
 */

exports.get = function(name){
  // XXX: need a better way to do this
  if ('id' === name && this.__id__) return this.__id__;
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
 * @constructor Resource
 * @param {String} attr Attribute name.
 * @return {Boolean} true if attribute exists, else false.
 * @api public
 */

exports.has = function(attr){
  return null != this.attrs[attr];
};

/**
 * Return the JSON representation of the resource.
 *
 * @constructor Resource
 * @return {Object} Resource attributes.
 * @api public
 */

exports.toJSON = function(){
  return this.attrs;
};

/**
 * Returns `Attr` definition if it has a default value.
 *
 * @constructor Resource
 * @param {String} name Attribute name.
 * @return {Boolean|Function} Attr definition if it exists, else.
 * @api private
 */

exports.defaultAttr = function(name){
  var defaultAttrs = this.constructor.attrs.__default__;
  return defaultAttrs.hasOwnProperty(name) && defaultAttrs[name];
};