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
      .attr('title').required()
      .attr('body');

    assert(1 == calls);
    assert.equal(Post, DefinedModel);

    assert.equal(2, Post.attrs.length);
    assert.deepEqual({ name: 'title', type: 'string' }, Post.attrs[0]);
    assert.deepEqual({ name: 'body', type: 'string' }, Post.attrs[1]);
  });

  it('should validate/save/query', function(done){
    var calls = [];

    model('user')
      .attr('email')
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

      model('user').query().on('data', function(records){
      //model('user').query(function(err, records){
        assert(1 === records.length);
        done();
      });
    });
  });

  it('should get/set attributes', function(){
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
    assert('example@gmail.com' === user.email());
    assert.deepEqual([user, 'example@gmail.com', undefined], calls[0]);
    assert.deepEqual(['example@gmail.com', undefined], calls[1]);

    assert.deepEqual(user.attrs, user.dirty);
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
          //.required()
        .attr('body', 'text')
        .attr('status', 'string')
          .validate('in', [ 'draft', 'published' ])
        .attr('tags', 'array')
          //.validate('lte', 5)

      var post = model('post').init();
      post.validate();
      assert(1 === post.errors.length);
      var post = model('post').init({ status: 'draft' });
      post.validate();
      assert(0 === post.errors.length);
    });
  });
});