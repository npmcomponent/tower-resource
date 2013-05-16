var model = require('..')
  , adapter = require('tower-adapter')
  , series = require('part-async-series')
  , assert = require('assert');

require('tower-memory-adapter');

describe('model', function(){
  beforeEach(model.clear);

  it('should define', function(){
    var calls = 0
      , DefinedModel;

    model.on('define', function(m){
      calls++;
      DefinedModel = m;
    });

    var Post = model('post')
      .attr('title')
      .attr('body');

    assert(1 == calls);
    assert(Post === DefinedModel);

    assert(2 === Post.attrs.length);
  });

  it('should validate/save/query', function(done){
    var calls = [];

    model('user')
      .validate(function(context, next){
        calls.push('validate1');
        next();
      })
      .validate(function(context){
        calls.push('validate2');
      });

    model('user').create(function(){
      assert(2 === calls.length);
      assert('validate1' === calls[0]);
      assert('validate2' === calls[1]);

      model('user').find(function(err, records){
        assert(1 === records.length);
        done();
      });
    });
  });

  describe('attrs', function(){
    it('should get/set', function(){
      var calls = [];

      model('user')
        .attr('email');

      var user = model('user').init();

      assert(undefined === user.email());
      user.on('change email', function(curr, prev){
        calls.push([curr, prev]);
      });
      model('user')
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
      model('todo')
        .attr('title', 'string')
        .attr('completed', 'boolean', false);

      var todo = model('todo').init();
      assert(false === todo.attrs.completed);
    });

    it('should not allow setting non-declared attrs', function(){
      model('non-declared');

      var record = model('non-declared').init();
      record.set('foo', 'bar');
      assert(undefined === record.get('foo'));
    });

    it('should sanitize/typcast', function(){
      model('sanitized')
        .attr('integerAttr', 'integer')
        .attr('floatAttr', 'float')
        .attr('stringAttr', 'string')
        // XXX: for dates, need to figure out 
        //      hook into more robust lib.
        .attr('dateAttr', 'date')
        .attr('booleanAttr', 'boolean')

      var record = model('sanitized').init();
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
  });

  // XXX: todo
  //it('should clear attributes if set back to original value', function(){
  //  var user = model('user').attr('email').create();
  //
  //  user
  //    .email('example@gmail.com')
  //    .email(undefined);
  //});

  describe('validations', function(){
    it('should validate', function(){
      model('post')
        .attr('title')
          .validate('present')
        .attr('body', 'text')
        .attr('status', 'string')
          .validate('in', [ 'draft', 'published' ])
        .attr('tags', 'array')
          //.validate('lte', 5)

      var post = model('post').init();
      post.validate();
      assert(2 === post.errors.length);
      assert('Invalid attribute: title' === post.errors[0]);
      assert('Invalid attribute: status' === post.errors[1]);
      var post = model('post').init({ status: 'draft' });
      post.validate();
      assert(1 === post.errors.length);
      var post = model('post').init({ status: 'draft', title: 'Hello World' });
      post.validate();
      assert(0 === post.errors.length);
    });
  });

  describe('query', function(){
    it('should have `all` method on constructor', function(){
      assert('function' === typeof model('todo').all);
    });
  });
});