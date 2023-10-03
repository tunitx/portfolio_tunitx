/**
 * @exports Authenticator
 */
(function () {

   "use strict";

   /**
    *
    * @name Authenticator
    * @constructor
    */
   function Authenticator(endPointUrl, assocHandle, baseUrl) {
      this._assocHandle = assocHandle;
      this._endPointUrl = endPointUrl;
      this._baseUrl = baseUrl;
      this._realm = (function(url) { return url.protocol + '//' + url.host + '/'; }(require('url').parse(baseUrl)));
   }

   /**
    * @type {String} The base url is the absolute URL to the root of the authenticated content (eg: http://domain.com/usercontent/)
    */
   Authenticator.prototype._baseUrl = "";

   /**
    * @type {String} The realm is the trusted domain that the user must agree to authenticating with, derived from the host of the base url (eg: http://domain.com/)
    */
   Authenticator.prototype._realm = "";

   /**
    * Sets the base url to be used in this authenticator, and will as a result also set the realm to match the base url.
    * @param {String} baseUrl
    * @return {Authenticator}
    */
   Authenticator.prototype.setBaseUrl = function(baseUrl) {
      if(baseUrl != this._baseUrl) {
         this._baseUrl = baseUrl;
         this._realm = (function(url) { return url.protocol + '//' + url.host + '/'; }(require('url').parse(baseUrl)));
      }
      return this;
   };

   /**
    * Gets the URL that should be used to authenticate a user with a terminal URL of the supplied backTo path.
    *
    * @param {String} backTo
    * @return {string}
    */
   Authenticator.prototype.getLogInUrl = function(backTo) {
      var params = this._getLoginParameters();
      params['openid.return_to'] += '?next=' + backTo;

      var url = this._endPointUrl + '?';
      for(var key in params) {
         url += key + '=' + encodeURIComponent(params[key]) + '&';
      }

      return url;
   };

   /**
    * Applies properties to the supplied object that will include email request parameters
    * @param {Object} params
    */
   Authenticator.prototype._mergeEmailRequest = function(params) {
      params['openid.ns.ax'] = 'http://openid.net/srv/ax/1.0';
      params['openid.ax.mode'] = 'fetch_request';
      params['openid.ax.required'] = 'email,firstname,lastname';

      params['openid.ax.type.email'] = 'http://schema.openid.net/contact/email';
      params['openid.ax.type.firstname'] = 'http://axschema.org/namePerson/first';
      params['openid.ax.type.lastname'] = 'http://axschema.org/namePerson/last';
   };

   /**
    * Gets the URL parameters used for associating a user's google account with this application
    * @return {Object}
    */
   Authenticator.prototype._getLoginParameters = function() {
      var params = this._getParameters();

      params['openid.claimed_id']   = 'http://specs.openid.net/auth/2.0/identifier_select';
      params['openid.identity']     = 'http://specs.openid.net/auth/2.0/identifier_select';
      params['openid.return_to']    = this._baseUrl + '/responder';
      params['openid.realm']        = this._realm;
      params['openid.assoc_handle'] = '';
      params['openid.mode'] = 'checkid_setup';
      this._mergeEmailRequest(params);

      return params;
   };

   Authenticator.prototype._getIdentityResponseParameters = function() {
      var params = this._getParameters();

      params['openid.claimed_id']   = 'http://specs.openid.net/auth/2.0/identifier_select';
      params['openid.identity']     = 'http://specs.openid.net/auth/2.0/identifier_select';
      params['openid.return_to']    = this._baseUrl + '/responder';
      params['openid.realm']        = this._realm;
      params['openid.assoc_handle'] = '';
      params['openid.mode'] = 'checkid_setup';
      this._mergeEmailRequest(params);

      return params;
   };

   /**
    * Gets the URL parameters used for cancelling the association of the google account with this application
    * @return {Object}
    */
   Authenticator.prototype._getCancelParameters = function() {
      return {
         'openid.ns': 'http://specs.openid.net/auth/2.0',
         'openid.mode': 'cancel'
      };
   };

   /**
    * Gets default parameters for all requests
    * @return {Object}
    */
   Authenticator.prototype._getParameters = function() {
      return {
         'openid.ns': 'http://specs.openid.net/auth/2.0',
         'openid.assoc_handle': this._assocHandle
      };
   };



   module.exports = Authenticator;

}());
