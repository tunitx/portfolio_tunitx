/**
 * @exports EndPointResolver
 */
(function () {

   "use strict";

   /**
    * Sends a request to the supplied discovery URL and parses the response for the URL that subsequent requests should
    * be sent. The result of calling the EndPointResolver is a promise interface that will be resolved with the end point
    * url or rejected if any errors took place.
    *
    * @param {String} discoveryUrl
    *
    * @name EndPointResolver
    * @constructor
    */
   function EndPointResolver(discoveryUrl) {
      var promise = new (require('promise-lite').Promise);
      require('xhrequest')(discoveryUrl, {
         success: function(data) {
            promise.resolve(EndPointResolver.getResultFromServerResponse(data.toString('utf8')));
         },
         error: function() {
            promise.reject(new Error("Unable to connect to end point discovery URL"));
         }
      });
      return promise;
   }

   /**
    * Given the response data from the discovery resource, retrieves the URI for making all further requests bound to.
    *
    * @param {String} data
    * @return {String}
    */
   EndPointResolver.getResultFromServerResponse = function(data) {
      return data.match(/<URI>(.+)<\/URI>/i)[1];
   };

   module.exports = EndPointResolver;

}());
