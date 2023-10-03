
var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon;

module.exports = new TestCase('Piping', function() {

   var Promise = require('../src/promise').Promise,
       doneFilter,
       failFilter,
       notifyFilter,
       doneHandler,
       failHandler,
       notifyHandler;

   return {
      setUp: function() {
         doneFilter = sinon.spy(function() {return 'foo'});
         failFilter = sinon.spy(function() {return 'bar'});
         notifyFilter = sinon.spy(function() {return 'baz'});
         doneHandler = sinon.spy();
         failHandler = sinon.spy();
         notifyHandler = sinon.spy();
      },
      tearDown: function() {
      },

      "test promises are piped": function() {
         var promise = new Promise;
         promise.pipe(doneFilter).done(doneHandler);

         promise.resolve('something');

         Assertions.assert(doneFilter.calledOnce, 'Filter was called by resolving outer promise');
         Assertions.assert(doneFilter.calledWith('something'), 'Filter called with the resolving data');
         Assertions.assert(doneHandler.calledWith('foo'), 'Handlers of piped promises called with result of filter');
      },

      "test piping without filters": function() {
         var promise = new Promise;
         promise.pipe(doneFilter, null, notifyFilter).then(doneHandler, failHandler, notifyHandler);

         promise.notify('something');
         promise.reject('something else');

         Assertions.assert(doneFilter.notCalled, 'Filter was not called by rejecting outer promise');
         Assertions.assert(notifyFilter.calledOnce, 'Filter was called by notifying outer promise');
         Assertions.assert(notifyFilter.calledWith('something'), 'Filter called with the notification data');
         Assertions.assert(doneHandler.notCalled, 'Handlers on unused states should not be called');

         Assertions.assert(failHandler.calledOnce, 'Handlers on used states should be called - fail');
         Assertions.assert(failHandler.calledWith('something else'), 'Handlers should be called with the outer Promise state value if not filtered');

         Assertions.assert(notifyHandler.calledOnce, 'Handlers of used states should be called - progress');
         Assertions.assert(notifyHandler.calledWith('baz'), 'Handlers should be called with the filtered value when filter is present');
      }
   }

});


