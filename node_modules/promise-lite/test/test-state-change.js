
var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon;

module.exports = new TestCase('State Changes', function() {

   var Promise = require('../src/promise').Promise;

   return {
      setUp: function() {
      },
      tearDown: function() {
      },

      "test promises are initially neither rejected nor resolved": function() {
         var promise = new Promise;
         Assertions.assert(promise.isPending());

         promise.notify();
         Assertions.assert(promise.isPending());
      },

      "test promises become resolved and can't move back": function() {
         var promise = new Promise;
         Assertions.assert(promise.isPending());

         promise.notify();
         Assertions.assert(promise.isPending());

         promise.resolve();
         Assertions.assert(promise.isResolved());

         promise.notify();
         Assertions.assert(promise.isResolved() && !promise.isPending() && !promise.isRejected());

         promise.reject();
         Assertions.assert(promise.isResolved() && !promise.isPending() && !promise.isRejected());
      },

      "test promises become rejected and can't move back": function() {
         var promise = new Promise;
         Assertions.assert(promise.isPending());

         promise.notify();
         Assertions.assert(promise.isPending());

         promise.reject();
         Assertions.assert(promise.isRejected());

         promise.notify();
         Assertions.assert(promise.isRejected() && !promise.isPending() && !promise.isResolved());
      }
   }

});


