var model = require('..')
  , adapter = require('tower-adapter')
  , assert = require('assert');

describe('model', function(){
  it('should define', function(){
    var calls = 0
      , DefinedModel;

    model.on('define', function(m){
      calls++;
      DefinedModel = m;
    });

    var Post = model('post')
      .attr('title')
        .validate('presence')
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

    model('user').save(function(){
      assert(2 === calls.length);
      assert('validate1' === calls[0]);
      assert('validate2' === calls[1]);

      model('user').query().on('data', function(records){
        assert(1 === records.length);
        done();
      });
    });
  });
});