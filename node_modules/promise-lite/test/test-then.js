
var TestCase = require('unit-test').TestCase,
    Assertions = require('unit-test').Assertions,
    sinon = require('unit-test').Sinon;

module.exports = new TestCase('Then', function() {

   var Promise = require('../src/promise').Promise;

   var deferrable = function(fn, scope, data) {
      deferrable.calls.push(function() {
         fn.call(scope, data);
      });
      return deferrable.calls.length - 1;
   };
   deferrable.calls = [];
   deferrable.run = function() {
      this.calls.splice(0, this.calls.length).forEach(function(f) {f()});
   };

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

      "test then handlers called shortly after attaching when on a promise that is already complete": function() {
         var promise = new Promise;
         promise.resolve().then(doneHandler, failHandler);

         Assertions.assert(doneHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(failHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');

         deferrable.run();
         Assertions.assert(doneHandler.calledOnce, 'Handler passed through to scheduler');
      },

      "test then handlers never schedule progress events for completed promises": function() {
         var promise = new Promise;
         promise.resolve().then(doneHandler, failHandler, notifyHandler);
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');

         deferrable.run();
         Assertions.assert(doneHandler.calledOnce, 'Handler passed through to scheduler');
      },

      "test then handlers schedule fail handlers": function() {
         var promise = new Promise;
         promise.reject().then(doneHandler, failHandler);

         Assertions.assert(doneHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(failHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');

         deferrable.run();
         Assertions.assert(failHandler.calledOnce, 'Handler passed through to scheduler');
      },

      "test errors thrown for non-functions": function() {
         var promise = new Promise;
         promise.resolve();
         try {
            promise.then(null);
            Assertions.assert(false, 'Providing a non-function as first argument for a chained promise should fail');
         }
         catch (e) {
            Assertions.assert(e instanceof TypeError, 'Should get a TypeError for not supplying a function');
         }
      },

      "test supplying scope as final argument no matter where (instead of fail)": function() {
         var promise = new Promise;
         var done = sinon.spy();
         var someScope = {};

         promise.resolve().then(done, someScope);
         deferrable.run();
         Assertions.assert(done.calledOnce, 'Handler called');
         Assertions.assert(done.calledOn(someScope), 'Handler scope should have been set');
      },

      "test supplying scope as final argument no matter where (instead of progress)": function() {
         var done = sinon.spy();
         var fail = sinon.spy();
         var someScope = {};

         new Promise().resolve().then(done, fail, someScope);
         deferrable.run();
         Assertions.assert(done.calledOnce, 'Resolution handler called');
         Assertions.assert(done.calledOn(someScope), 'Resolution handler scope should have been set');

         new Promise().reject().then(done, fail, someScope);
         deferrable.run();
         Assertions.assert(fail.calledOnce, 'Fail handler called');
         Assertions.assert(fail.calledOn(someScope), 'Fail handler scope should have been set');
      },

      "test chaining functions through then": function() {
         var nextPromise = new Promise;

         var finalDone = sinon.spy();
         var done = sinon.spy(function() { return 'BAR'; });
         var promiseDone = sinon.spy(function() {
            return nextPromise
         });

         var promise = new Promise();
         promise.then(promiseDone).then(done).then(finalDone);

         Assertions.assert(!promiseDone.called, 'No then handlers should be called until there is a resolution');
         Assertions.assert(!done.called, 'No then handlers should be called until there is a resolution');

         promise.resolve('BLAH');
         Assertions.assert(promiseDone.calledOnce, 'First handler should be called');
         Assertions.assert(promiseDone.calledWith('BLAH'), 'First handler should be called with the result of the original');
         Assertions.assert(!done.called && !finalDone.called, 'Subsequent handlers after a promised response are not called');

         nextPromise.resolve('FOO');
         Assertions.assert(promiseDone.calledOnce, 'First handler is not called again');
         Assertions.assert(done.calledOnce && finalDone.calledOnce, 'Subsequent handlers now called');
         Assertions.assert(done.calledWith('FOO'), 'Subsequent handler called with resolution of its parent');
         Assertions.assert(finalDone.calledWith('BAR'), 'Subsequent handler called with return value of its parent');

      }
   }

});
