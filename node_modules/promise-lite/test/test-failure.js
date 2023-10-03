
var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon;

module.exports = new TestCase('Failure', function() {

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

      "test fail handlers not called as attached": function() {
         var promise = new Promise;
         promise.fail(failHandler, failScope);
         Assertions.assert(failHandler.notCalled, 'Handlers are not called as they are attached');
         Assertions.assert(Promise.delay.notCalled, 'Handlers are not scheduled to be called as they are attached');
      },

      "test fail handlers called immediately on rejecting the promise": function() {
         var promise = new Promise;
         promise.fail(failHandler, failScope);
         Assertions.assert(failHandler.notCalled && Promise.delay.notCalled, 'Handlers not called on attaching');

         promise.reject(anotherScope);
         Assertions.assert(failHandler.calledOnce, 'Handlers called on rejection');
         Assertions.assert(failHandler.calledOn(failScope), 'Handlers called in the supplied scope');
         Assertions.assert(failHandler.calledWith(anotherScope), 'Handlers called with the data supplied in the event');
      },

      "test fail handlers not called when not rejecting the promise": function() {
         var promise = new Promise;
         promise.fail(failHandler, failScope);
         promise.notify();
         promise.resolve();
         Assertions.assert(failHandler.notCalled && Promise.delay.notCalled, 'Handlers not called on progress or resolve');
      },

      "test fail handlers scheduled to be called when binding to an already rejected promise": function() {
         var promise = new Promise;
         promise.reject(anotherScope);
         promise.fail(failHandler, failScope);
         Assertions.assert(failHandler.notCalled, 'Handlers not called immediately');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers scheduled for execution');

         deferrable.calls[0]();
         Assertions.assert(failHandler.calledOn(failScope), 'Handlers called in the correct scope');
         Assertions.assert(failHandler.calledWith(anotherScope), 'Handlers called with the event data');
      }
   }

});


