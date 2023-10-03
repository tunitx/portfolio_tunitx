
Promise.js
==========

## Installation

Promise can be used either in a [Node.js](http://nodejs.org) environment or in a browser, to install for Node.js use
the [npm](http://npmjs.org) package manager:

    npm install promise-lite

To use in the browser, you just need the `src/promise.js` file and the
[Subscribable](https://github.com/steveukx/subscribable/) library that is used to handle the pub-sub events
Promise uses internally.

## Usage

The `Promise` constructor in Node.js is required by:

    var Promise = require('promise-lite');

In a browser, Promise will be declared in `window` scope anyway so can just be used as `Promise`.

Promises are used to make otherwise asynchronous actions chainable, by linking them together with the Promise that they
will return a value at some point in the future.

