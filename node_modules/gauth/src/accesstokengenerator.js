/**
 * @exports AccessTokenGenerator
 */
(function () {

   "use strict";

   /**
    * The AccessTokenGenerator requires an end point URL that requests can be sent to and returns a promise interface
    * that will be resolved with the access token or rejected should any errors take place.
    *
    * @name AccessTokenGenerator
    * @constructor
    */
   function AccessTokenGenerator(endPointUrl) {
      var promise = new (require('promise-lite').Promise);
      var query = '?' + require('querystring').stringify({
         "openid.ns": 'http://specs.openid.net/auth/2.0',
         "openid.mode": "associate",
         "openid.assoc_type": "HMAC-SHA1",
         "openid.session_type": "no-encryption"
      });

      require('xhrequest')(endPointUrl + query, {
         success: function (data) {
            promise.resolve(AccessTokenGenerator.getResultFromServerResponse(data.toString('utf8')));
         },
         error: function () {
            promise.reject(new Error("Unable to fetch an access token"));
         }
      });
      return promise;
   }

   AccessTokenGenerator.getResultFromServerResponse = function (data) {
      return data.match(/assoc_handle\:(.+)/)[1];
   };

   module.exports = AccessTokenGenerator;

}());
