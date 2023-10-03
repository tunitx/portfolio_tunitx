(function (root, promiseFactory) {
   if(typeof module !== "undefined" && module.exports) { // Node.js
      module.exports = promiseFactory(require('subscribable'));
   }
   else  if (typeof define === "function" && define.amd) { // AMD
      define(['subscribable'], promiseFactory);
   }
   else { // <script>
      root.Promise = promiseFactory(root.Subscribable);
   }
}(this, function (Subscribable) {

   "use strict";

   /**
    *
    * @constructor
    * @name Promise
    */
   function Promise() {
      Subscribable.prepareInstance(this);
   }

   /**
    * Calls the scoped function with the arguments specified in the next execution context.
    *
    * @param {Function} fn
    * @param {Object} scope
    * @param {Object} data
    * @function
    * @ignore
    */
   Promise.delay = (typeof process == 'object' && process.nextTick) ? (function(fn, scope, data) {
      process.nextTick(function() {fn.call(scope, data);});
   }) : function(fn, scope, data) {
      window.setTimeout(function() {fn.call(scope, data);}, 0);
   };

   /**
    * The status of having not yet been resolved or rejected
    * @type {String}
    */
   Promise.PENDING = 'waiting...';

   /**
    * The status of having been resolved - this is a terminating status and once reached cannot be changed
    * @type {String}
    */
   Promise.SUCCESS = 'a-okay!';

   /**
    * The status of having been rejected - this is a terminating status and once reached cannot be changed
    * @type {String}
    */
   Promise.FAILURE = 'there was a problem :os';

   /**
    * When the Promise has been resolved or rejected, the done and fail methods for attaching new handlers are replaced
    * with either this or the empty method to either always call or never call the handler. Forms part of the contract
    * that a Promise can only complete its path once.
    *
    * @param {Function} fn
    * @param {Object} scope
    * @return {Promise}
    */
   Promise.callNext = function(fn, scope) {
      if(typeof fn == 'function') {
         Promise.delay(fn, scope, this._result);
      }
      return this;
   };

   /**
    * An empty method that can be referenced to a Promise instance method to remove its functionality - attached as soon
    * as a Promise is resolved or rejected, ensures a single completion result and removes status checking in event attaching
    * and notification methods.
    *
    * @return {Promise}
    */
   Promise.empty = function() {
      return this;
   };

   /**
    * The current state of the Promise - by default should be in the Pending state
    * @type {String}
    */
   Promise.prototype._status = Promise.PENDING;

   /**
    * Wrapper for the event handler to allow for sending rubbish into the Subscribable, makes other functions simpler
    * throughout the rest of the Promise
    *
    * @param {String} eventName
    * @param {Function} func
    * @param {Object} [scope]
    * @return {Promise}
    */
   Promise.prototype._on = function(eventName, func, scope) {
      if(func && func instanceof Function) {
         this.on(eventName, func, scope);
      }
      return this;
   };

   /**
    * Gets whether this Promise has been resolved
    * @return {Boolean}
    */
   Promise.prototype.isResolved = function() {
      return this._status === Promise.SUCCESS;
   };

   /**
    * Gets whether this Promise has been rejected
    * @return {Boolean}
    */
   Promise.prototype.isRejected = function() {
      return this._status === Promise.FAILURE;
   };

   /**
    * Gets whether this Promise has not yet been resolved or rejected
    * @return {Boolean}
    */
   Promise.prototype.isPending = function() {
      return this._status === Promise.PENDING;
   };

   /**
    * Attaches a handler for when this Promise is resolved, attaching a handler after the Promise is already resolved
    * will call back in the next execution scope (ie: will always
    *
    * @param {Function} done A function to call when the promise is resolved
    * @param {Object} [scope] The optional scope to call done with on resolution of the promise
    */
   Promise.prototype.done = function(done, scope) {
      return this._on(Promise.SUCCESS, done, scope);
   };

   Promise.prototype.fail = function(fail, scope) {
      return this._on(Promise.FAILURE, fail, scope);
   };

   Promise.prototype.always = function(complete, scope) {
      return this.done(complete, scope).fail(complete, scope);
   };

   Promise.prototype.then = function(done, fail, progress, scope) {
      if('function' !== typeof done) {
         throw new TypeError('Promise.then must have a function as the first argument');
      }

      if(!scope && 'function' !== typeof arguments[arguments.length - 1] && arguments[arguments.length - 1]) {
         scope = arguments[arguments.length - 1];
      }

      this.fail(fail, scope).progress(progress, scope);

      // when this promise has completed successfully
      var promise = new Promise();
      this.done(function() {
         var result, err;
         try {
            // try running the done handler
            result = done.apply(scope, arguments);
         }
         catch (e) {
            err = e;
         }

         // if it threw an error, reject the new promise so any chained .then(_, FAIL) handlers get called
         if(err) {
            promise.reject(err);
         }

         // if no error was thrown and the return is another promise, then pipe that promise onto the returned one
         else if (result instanceof Promise) {
            result.pipeTo(promise);
         }

         // if no error was thrown and the return is a result then resolve the returned promise to call .then(DONE) handlers
         else {
            promise.resolve(result);
         }
      });

      return promise
   };

   Promise.prototype._complete = function(status, result) {
      if(this._status == Promise.PENDING) {
         this._result = result;
         this._status = status;
         this.fire(status, result);
         this.un();

         this.done = status === Promise.SUCCESS ? Promise.callNext : Promise.empty;
         this.fail = status === Promise.FAILURE ? Promise.callNext : Promise.empty;
         this.always = Promise.callNext;
         this.progress = Promise.empty;
         this.notify = this.reject = this.resolve = Promise.empty;
      }
      return this;
   };

   /**
    * Resolves this Promise, notifying all handlers with the first argument sent to this function.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.resolve = function(data) {
      return this._complete.call(this, Promise.SUCCESS, data);
   };

   /**
    * Rejects this Promise, notifying all fail handlers with the first argument sent to this function.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.reject = function(data) {
      return this._complete.call(this, Promise.FAILURE, data);
   };

   /**
    * Sends a notification through this Promise, notify calls all progress handlers so long as the Promise is in the
    * PENDING state.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.notify = function(data) {
      this.fire(Promise.PENDING, data);
      return this;
   };

   /**
    * Binds a handler to the progress event, these handlers will be called when a notify update takes place.
    *
    * @param {Function} handler
    * @param {Object} [scope]
    * @return Promise
    */
   Promise.prototype.progress = function(handler, scope) {
      return this._on(Promise.PENDING, handler, scope);
   };

   /**
    * Creates a new Promise that will be resolved, rejected or notified as a result of events on the current Promise,
    * the optional filter functions can be used to change the value that is passed through to the Promise that this
    * function returns.
    *
    * When one of the filters isn't supplied, the new Promise is updated using the same value that was sent into the
    * current Promise.
    *
    * @example
    * var promise = new Promise;
    * var pipedPromise = promise.pipe(function(val) {return val * 2})
    *                      .then(function(result){alert(result);});
    *
    * promise.resolve(2); // alerts 4
    *
    * @param {Function} [doneFilter]
    * @param {Function} [failFilter]
    * @param {Function} [notifyFilter]
    * @return {Promise}
    */
   Promise.prototype.pipe = function(doneFilter, failFilter, notifyFilter) {
      return this.pipeTo(new Promise, doneFilter, failFilter, notifyFilter);
   };

   /**
    * Essentially the reverse of the Promise#pipe function, this method will attempt to reject, resolve and notify the
    * supplied Promise whenever this Promise is rejected, resolved or notified. The return value is the supplied
    * Promise instance to allow for chaining on that promise.
    *
    * If the supplied promise isn't an instance of this Promise class, no handlers will be bound to it.
    *
    * @param {Promise} promise
    * @param {Function} [doneFilter]
    * @param {Function} [failFilter]
    * @param {Function} [notifyFilter]
    */
   Promise.prototype.pipeTo = function(promise, doneFilter, failFilter, notifyFilter) {
      if(promise instanceof Promise) {
         this.then(function(data) {
            promise.resolve(doneFilter ? doneFilter(data) : data);
         }, function(data) {
            promise.reject(failFilter ? failFilter(data) : data);
         }, function(data) {
            promise.notify(notifyFilter ? notifyFilter(data) : data);
         });
      }
      return promise;
   };

   // backwards compatibility - the Promise used to be exported as a property of the main export not as the export
   Promise.Promise = Promise;

   return Promise;

}));
