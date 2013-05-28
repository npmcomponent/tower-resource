# Tower Resource

## Installation

node:

```
npm install tower-resource
```

browser:

```
component install tower/resource
```

## API

No examples yet, come back later :)

``` js
var resource = require('tower-resource');

resource('user')
  .attr('firstName')
  .attr('lastName')
  .attr('email')
    .validate('presence')
    .validate('isEmail')
  .hasMany('posts')
```

You can also customize the class/prototype:

``` js
var User = resource('user');
```

Each resource class gets stored in a globally registered instance of `tower-container`:

``` js
var container = require('tower-container');

User == container.lookup('resource', 'user');
```

The goal of the resource is to define the data in your app. Data can be things like:

- database records (traditional resources in MVC)
- reports (or query results from `count` or `groupBy`)
- api resources
- simple value objects
- etc.

Unlike traditional ORMs such as ActiveRecord for Rails, the resource isn't the central api for accessing the database; that happens through the `controller`.

To save/remove a single record, you can do it from the resource:

``` js
user.save();
user.remove();
```

But, internally this just delegates to the controller.

### Resource#build

``` js
var user = resource('user').build();
```

You can also do this the more traditional way:

``` js
var User = resource('user');
var user = new User;
```

### Resource#save

``` js
user.save();
user.save(false); // save and don't validate
```

### Resource#remove

``` js
user.remove();
```

### Resource#validate

``` js
user.validate();
```

The `validate` method is automatically called when you call `save()`.

The `validate` method is also super optimized.

You can define your own custom validations too, see the `tower-resource-validator` library.

### Resource#errors

``` js
user.errors;
```

### Resource#attrs

All of the attributes and values are stored on the `attrs` property on the record. Unlike the class `attrs` method, this is just a simple hash (not a `Set`).

``` js
user.attrs;
```

### Resource#dirty

All of the changed properties are stored here.

``` js
user.dirty;
```

As you set properties, it will modify the `dirty` object. But, you may end up setting some of the values back to the original value. Once you try to `save` the record, the union of `attrs` and `dirty` will be sent to the database adapter only, so those properties you set back to the original values won't actually get saved.

### Resource#isNew

Check if the resource is a new record (hasn't been persisted, doesn't have an `id`).

``` js
user.isNew();
```

### Resource#has

Check if `attr` is present (not `null` or `undefined`).

``` js
user.has('email') //=> false
user.set('email', 'foo.bar@gmail.com')
user.has('email') //=> true
```

### Resource.attr

``` js
resource('user')
  .attr('email')
  .attr('email', 'string')
  .attr('email', { type: 'string' })
  .attr('username').val(function(record, key){
    // default value
    return record.email.split('@');
  })
  .attr('username').val('something_else')
```

You can call `attr('email')` as many times as you want, it will only append data to it.

The `type` field gets mapped to a globally defined type, with a `to` and `from` serializer.

When you set an attribute, it first passes through any _sanitizers_, then any _normalizers_ to typecast it. When you want to render it in a UI, you pass it through _formatters_.

### Resource.attrs

All of the attributes you've defined are stored into a `Set` - an ordered hash.

``` js
resource('user').attrs.forEach(function(attr){
  console.log(attr.name, attr);
});
```

### Resource.validate

The `validate` class method can be applied to either the resource class itself, or an attribute.

The simple case is validating an attribute, such as validating `email` is formatted as an email, or that the `username` is unique:

``` js
resource('user')
  .attr('email')
    .validate('isEmail')
  .attr('username')
    .validate('isUsername')
```

To define validations at the class level, make sure the fluent API's context is set back to the resource, rather than an attribute. You can do this by either defining the validation right after `resource('user')`, or by calling `.self()` in the DSL, which resets the DSL's context.

``` js
resource('user')
  .validate(function(record){
    return !!record;
  })
  .attr('email')
    .validate('email')
    .validate(function(record, key){
      return !!record[key].match('gmail.com');
    })
```

### Resource.prototype

You can add custom methods to a record by modifying the class prototype.

``` js
var User = resource('user');

User.prototype.fullName = function(){
  return this.firstName + ' ' + this.lastName;
}
```

### Resource.on

``` js
resource('user')
  .on('save', function() {})
  .on('saved', function() {})
  .on('create', function() {})
  .on('created', function() {})
  .on('update', function() {})
  .on('updated', function() {})
  .on('removed', function() {})
  .on('remove', function() {})
  .on('error', function() {})
```

### Resource.use

Add plugins to the resource.

``` js
resource('user')
  .use(timestamps);

function timestamps(m){
  m.attr('createdAt', 'date')
  m.attr('updatedAt', 'date')
}
```

## Run tests

```
mocha
```

## License

MIT