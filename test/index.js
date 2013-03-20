var model = require('../lib/index')
  , container = require('tower-container')
  , assert = require('chai').assert;

describe('test', function() {
  it('should define', function(done) {
    model.on('defined', function(definedModel) {
      assert.equal(Post, definedModel);

      assert.equal(2, Post.attrs.length);
      assert.deepEqual({ name: 'title' }, Post.attrs[0]);
      assert.deepEqual({ name: 'body' }, Post.attrs[1]);

      done();
    });

    var Post = model('Post')
      .attr('title')
        .validate('presence')
      .attr('body');

    assert.equal(Post, container.get('model:Post'));

    console.log(new Post)
  });
});
