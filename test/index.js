var model = require('../lib/index')
  , assert = require('assert');

describe('model', function(){
  it('should define', function(){
    var calls = 0
      , DefinedModel;

    model.on('define', function(m){
      calls++;
      DefinedModel = m;
    });

    var Post = model('Post')
      .attr('title')
        .validate('presence')
      .attr('body');

    assert(1 == calls);
    assert.equal(Post, DefinedModel);

    assert.equal(2, Post.attrs.length);
    assert.deepEqual({ name: 'title', type: 'string' }, Post.attrs[0]);
    assert.deepEqual({ name: 'body', type: 'string' }, Post.attrs[1]);
  });
});