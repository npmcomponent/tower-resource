
var series = require('part-async-series');

if ('undefined' === typeof window) {
  var resource = require('..');
  var assert = require('assert');
} else {
  var resource = require('tower-resource');
  var assert = require('timoxley-assert');
}

require('tower-memory-adapter');

describe('resource', function(){
  beforeEach(resource.clear);

  it('should define', function(){
    var calls = 0;
    var DefinedResource;

    resource.on('define', function(m){
      calls++;
      DefinedResource = m;
    });

    var Post = resource('post')
      .attr('title')
      .attr('body');

    assert(1 === calls);
    assert(Post === DefinedResource);

    // assert(2 === Post.attrs.length);
  });

  it('should validate/save/query', function(done){
    var calls = [];

    resource('user')
      .validate(function(context, next){
        calls.push('validate1');
        next();
      })
      .validate(function(context){
        calls.push('validate2');
      });

    resource('user').create(function(){
      assert(2 === calls.length);
      assert('validate1' === calls[0]);
      assert('validate2' === calls[1]);

      resource('user').find(function(err, records){
        assert(1 === records.length);
        done();
      });
    });
  });

  describe('attrs', function(){
    it('should get/set', function(){
      var calls = [];

      resource('user')
        .attr('email');

      var user = resource('user').init();

      assert(undefined === user.email());
      user.on('change email', function(curr, prev){
        calls.push([curr, prev]);
      });
      resource('user')
        .on('change email', function(record, curr, prev){
          calls.push([record, curr, prev]);
        });

      user.email('example@gmail.com');
      assert('example@gmail.com' === user.get('email'));
      assert('example@gmail.com' === user.email());
      assert.deepEqual([user, 'example@gmail.com', undefined], calls[0]);
      assert.deepEqual(['example@gmail.com', undefined], calls[1]);

      assert.deepEqual(user.attrs, user.dirty);
    });

    it('should set default attributes on init', function(){
      // XXX: is there a more optimized way than this?
      // thinking that it's more optimized _not_ to do lazy
      // evaluation here, b/c everything (adapters, templates/scopes, etc.)
      // will constantly be lazily evaluating.
      // if we can assume that the attributes are set, then
      // in those cases it can just grab `.attrs`, which is much more optimized.
      resource('todo')
        .attr('title', 'string')
        .attr('completed', 'boolean', false);

      var todo = resource('todo').init();
      assert(false === todo.attrs.completed);
    });

    it('should not allow setting non-declared attrs', function(){
      resource('non-declared');

      var record = resource('non-declared').init();
      record.set('foo', 'bar');
      assert(undefined === record.get('foo'));
    });

    it('should sanitize/typcast', function(){
      resource('sanitized')
        .attr('integerAttr', 'integer')
        .attr('floatAttr', 'float')
        .attr('stringAttr', 'string')
        // XXX: for dates, need to figure out 
        //      hook into more robust lib.
        .attr('dateAttr', 'date')
        .attr('booleanAttr', 'boolean');

      var record = resource('sanitized').init();
      record.set('integerAttr', '61');
      assert(61 === record.get('integerAttr'));
      record.set('floatAttr', '6.1');
      assert(6.1 === record.get('floatAttr'));
      record.set('stringAttr', 100);
      assert('100' === record.get('stringAttr'));
      record.set('dateAttr', '1948-07-15');
      assert(Date.parse('1948-07-15') === record.get('dateAttr').getTime());
      record.set('booleanAttr', 0);
      assert(false === record.get('booleanAttr'));
      record.set('booleanAttr', 1);
      assert(true === record.get('booleanAttr'));
    });

    it('should coerce attr to default value if set to undefined', function(){
      resource('coerced')
        .attr('foo', 'string', 'bar');

      var record = resource('coerced').init();
      assert('bar' === record.get('foo'));
      // XXX: maybe b/c of this, we can get rid of `get` doing the check.
      record.set('foo', undefined);
      assert('bar' === record.get('foo'));
    });
  });

  describe('validations', function(){
    it('should validate', function(){
      resource('post')
        .attr('title')
          .validate('present')
        .attr('body', 'text')
        .attr('status', 'string')
          .validate('in', [ 'draft', 'published' ])
        .attr('tags', 'array')
          //.validate('lte', 5)

      var post = resource('post').init();
      post.validate();
      assert(2 === post.errors.length);
      assert('Invalid attribute: title' === post.errors[0]);
      assert('Invalid attribute: status' === post.errors[1]);
      var post = resource('post').init({ status: 'draft' });
      post.validate();
      assert(1 === post.errors.length);
      var post = resource('post').init({ status: 'draft', title: 'Hello World' });
      post.validate();
      assert(0 === post.errors.length);
    });
  });

  describe('query', function(){
    it('should have `all` method on constructor', function(){
      assert('function' === typeof resource('todo').all);
    });
  });
});