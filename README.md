# Tower Model

[![Build Status](https://secure.travis-ci.org/viatropos/tower-model.png)](http://travis-ci.org/viatropos/tower-model)

## Installation

For Node.js

```
npm install tower-model
```

For the browser:

```
component install tower/model
```

## Quick Start

No examples yet, come back later :)

``` javascript
var model = require('tower-model');

var User = model('user')
  .attr('firstName')
  .attr('lastName')
  .attr('email')
    .validate('presence')
    .validate('isEmail')
  .hasMany('posts')
```

## Run tests

```
mocha
```

## License

MIT