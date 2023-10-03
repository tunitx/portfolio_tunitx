
var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon;

module.exports = new TestCase('Progress Events', function() {

   var Promise = require('../src/promise').Promise;

   var deferrable = function(fn, scope, args) {
      deferrable.calls.push(function() {fn.apply(scope, args);});
      return deferrable.calls.length - 1;
   };
   deferrable.calls = [];

   var notifyHandler, notifyScope, doneHandler, doneScope, failHandler, failScope, anotherHandler, anotherScope;

   return {
      setUp: function() {
         notifyHandler = sinon.spy(); doneHandler = sinon.spy(); failHandler = sinon.spy(); anotherHandler = sinon.spy();
         notifyScope = {a:1}; doneScope = {b:1}; failScope = {c:1}; anotherScope = {d:1};
         sinon.stub(Promise, 'delay', deferrable);
      },
      tearDown: function() {
         notifyHandler = notifyScope = doneHandler = doneScope = failHandler = failScope = null;
         Promise.delay.restore();
         deferrable.calls.splice(0, deferrable.calls.length);
      },

      "test progress handlers not called as attached": function() {
         var promise = new Promise;
         promise.progress(notifyHandler, notifyScope);
         Assertions.assert(notifyHandler.notCalled, 'Handlers are not called as they are attached');
         Assertions.assert(Promise.delay.notCalled, 'Handlers are not scheduled to be called as they are attached');
      },

      "test progress and notify pass the result on": function() {
         var promise = new Promise;
         promise.progress(notifyHandler, notifyScope);
         promise.notify(anotherScope);

         Assertions.assert(notifyHandler.calledOnce, 'Handlers called immediately as a notification is pushed to the promise');
         Assertions.assert(notifyHandler.calledOn(notifyScope), 'Handlers are called back in the scope supplied');
         Assertions.assert(notifyHandler.calledWith(anotherScope), 'Handlers are called with the data supplied in the event');
      },

      "test progress events are ignored only once the promise is in a complete state": function() {
         var promise = new Promise;
         promise.progress(notifyHandler);
         promise.notify('foo');
         Assertions.assert(notifyHandler.calledOnce, 'Handlers called on notify')
                   .assert(notifyHandler.calledWith('foo'), 'Handlers given the data supplied');

         promise.notify('bar');
         Assertions.assert(notifyHandler.calledTwice, 'Handlers called each time notify happens')
                   .assert(notifyHandler.calledWith('bar'), 'Handlers get called with the data from the specific event');

         promise.resolve();
         promise.notify('baz');
         Assertions.assert(notifyHandler.calledTwice, 'Handlers no longer called when resolved');
      }
   }

});


