
var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon;

module.exports = new TestCase('Completion', function() {

   var Promise = require('../src/promise').Promise;

   var deferrable = function(fn, scope, data) {
      deferrable.calls.push(function() {
         fn.call(scope, data);
      });
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

      "test done handlers not called as attached": function() {
         var promise = new Promise;
         promise.done(doneHandler, doneScope);
         Assertions.assert(doneHandler.notCalled, 'Handlers are not called as they are attached');
         Assertions.assert(Promise.delay.notCalled, 'Handlers are not scheduled to be called as they are attached');
      },

      "test done handlers called immediately on resolving the promise": function() {
         var promise = new Promise;
         promise.done(doneHandler, doneScope);
         Assertions.assert(doneHandler.notCalled && Promise.delay.notCalled, 'Handlers not called on attaching');

         promise.resolve(anotherScope);
         Assertions.assert(doneHandler.calledOnce, 'Handlers called on resolution');
         Assertions.assert(doneHandler.calledOn(doneScope), 'Handlers called in the supplied scope');
         Assertions.assert(doneHandler.calledWith(anotherScope), 'Handlers called with the data supplied in the event');
      },

      "test done handlers not called when not resolving the promise": function() {
         var promise = new Promise;
         promise.done(doneHandler, doneScope);
         promise.notify();
         promise.reject();
         Assertions.assert(doneHandler.notCalled && Promise.delay.notCalled, 'Handlers not called on progress or reject');
      },

      "test done handlers scheduled to be called when binding to an already resolved promise": function() {
         var promise = new Promise;
         promise.resolve(anotherScope);
         promise.done(doneHandler, doneScope);
         Assertions.assert(doneHandler.notCalled, 'Handlers not called immediately');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers scheduled for execution');

         deferrable.calls[0]();
         Assertions.assert(doneHandler.calledOn(doneScope), 'Handlers called in the correct scope');
         Assertions.assert(doneHandler.calledWith(anotherScope), 'Handlers called with the event data');
      },

      "test resolving an already resolved promise does not change the result data": function() {
         var promise = new Promise;
         promise.resolve(doneScope);
         promise.resolve(anotherScope);
         promise.done(doneHandler);

         deferrable.calls[0]();
         Assertions.assert(doneHandler.calledWith(doneScope), 'Handlers called with the first completion event data');
      },

      "test resolving an already resolved promise does not fire the already called handlers": function() {
         var promise = new Promise;
         promise.done(doneHandler);
         promise.resolve(doneScope);
         promise.resolve(anotherScope);

         Assertions.assert(doneHandler.calledOnce, 'Handlers called once no matter how many times a completion event occurs');
         Assertions.assert(doneHandler.calledWith(doneScope), 'Handlers called with the first completion event data');
      }
   }

});


