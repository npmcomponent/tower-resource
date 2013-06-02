# Tower Resource

The data component.

## Installation

node:

```bash
$ npm install tower-resource
```

browser:

```bash
$ component install tower/resource
```

## Examples

```js
var resource = require('tower-resource');
```

### Attributes

```js
resource('post')
  .attr('title') // defaults to 'string'
  .attr('body', 'text')
  .attr('published', 'boolean', false);
```

### Validations

```js
resource('user')
  .attr('email')
    .validate('presence')
    .validate('isEmail')
    .validate('emailProvider', { in: [ 'gmail.com' ] }) // some hypothetical one
  .attr('username')
    .validator(function(val){
      return !!val.match(/[a-zA-Z]/);
    });
```

There are two DSL methods for validation.

1. `validate`: for using predefined validations (see [tower-validator](https://github.com/tower/validator)), purely to clean up the API.
2. `validator`: for defining custom validator functions right inline. If you want to reuse your custom validator function, just move the function into tower-validator.

### Queries

```js
resource('post')
  .where('published').eq(true)
  .all(function(err, posts){

  });
```

See [tower-query]() for the entire syntax. The `where` method just delegates to a `Query` instance. You can also access the query object directly (it just adds `.select(resourceName)` for you):

```js
resource('post').query().sort('title', -1).all();
```

### Actions

There are 4 main actions for resources (which are just delegated to `query().action(name)`:

- create
- all
- update
- remove

```js
resource('post').create();
resource('post').all();
resource('post').update({ published: true });
resource('post').remove();
```

## License

MIT