/**
 * @exports GAuth
 */
(function () {

   "use strict";

   var Subscribable = require('subscribable');
   var Promise = require('promise-lite').Promise;

   /**
    * The overall authenticator module
    *
    * @name GAuth
    * @constructor
    */
   function GAuth() {
      this._defaultConfiguration();

      for (var i = 0, l = arguments.length; i < l; i++) {
         if ('function' === typeof arguments[i]) {
            arguments[i](this);
         }
         else {
            // what other kind of argument do we care about?
         }
      }

      this._getEndPoint()
          .then(this._getAccessToken, this)
          .then(this._buildAuthenticator, this)
          .then(this._ready, this)
   }

   GAuth.prototype = Object.create(Subscribable.prototype);

   /**
    * @type {Function} The end point resolver
    */
   GAuth.endPointResolver = require('./endpointresolver.js');

   /**
    * @type {Function} The access token generator
    */
   GAuth.accessTokenGenerator = require('./accesstokengenerator.js');

   /**
    * Gets the serialization data for this instance
    * @return {String}
    */
   GAuth.prototype.serialize = function() {
      return JSON.stringify(this._configuration);
   };

   /**
    * Sets up the request for an end point
    * @return {Promise}
    */
   GAuth.prototype._getEndPoint = function () {
      if(this._configuration['endpoint.url']) {
         return new Promise().resolve(this._configuration['endpoint.url']);
      }
      else {
         return GAuth.endPointResolver(this._configuration['discover.url'])
                  .done(function (endPointUrl) { this._configure('endpoint.url', endPointUrl) }, this);
      }
   };

   /**
    * Sets up the request for an access token
    * @return {Promise}
    */
   GAuth.prototype._getAccessToken = function () {
      if(this._configuration['access.token']) {
         return new Promise().resolve(this._configuration['access.token']);
      }
      else {
         return GAuth.accessTokenGenerator(this._configuration['endpoint.url'])
             .done(function (endPointUrl) { this._configure('access.token', endPointUrl) }, this);
      }
   };

   /**
    *
    * @return {Authenticator}
    */
   GAuth.prototype._buildAuthenticator = function() {
      var Authenticator = require('./authenticator.js');
      return this._authenticator = new Authenticator(this._configuration['endpoint.url'],
                                                       this._configuration['access.token'],
                                                       this._configuration['base.url']);
   };

   /**
    * Fires the ready event for any listener that cares.
    */
   GAuth.prototype._ready = function() {
      this.fire('ready', this);
   };

   /**
    *
    * @param returnPath
    * @return Promise
    */
   GAuth.prototype.logIn = function(returnPath) {
      var promise = arguments[1] || new Promise;

      if(!this._authenticator) {
         this.on('ready', this.logIn.bind(this, returnPath, promise));
      }
      else {
         promise.resolve(this._authenticator.getLogInUrl(returnPath));
      }

      return promise;
   };

   /**
    * Set the configuration options that should be used unless otherwise overridden.
    */
   GAuth.prototype._defaultConfiguration = function () {
      this._configuration = {};
      this._configure('discover.url', 'https://www.google.com/accounts/o8/id');
      this._configure('base.url', '');
   };

   /**
    * Set the end point URL of the authenticator, by setting this in advance you will prevent the authenticator
    * from attempting to discover the end point URL.
    *
    * @param {String} endPointUrl
    */
   GAuth.endPoint = function (endPointUrl) {
      return function (auth) {
         auth._configure('endpoint.url', endPointUrl);
      }
   };

   /**
    * Set the end point URL of the authenticator, by setting this in advance you will prevent the authenticator
    * from attempting to discover the end point URL.
    *
    * @param {String} endPointUrl
    */
   GAuth.endPoint = function (endPointUrl) {
      return GAuth.configure('endpoint.url', endPointUrl);
   };

   /**
    * Sets a configuration option for use by the authenticator
    *
    * @param {String} key
    * @param {String|Object} value
    * @name GAuth.configure
    * @function
    */
   GAuth.configure = GAuth.prototype._configure = function (key, value) {
      if (this instanceof GAuth) {
         this._configuration[key] = value;
         return this;
      }
      else {
         return function (auth) {
            auth._configure(key, value);
         }
      }
   };

   /**
    * Given a JSON string, configures the new instance with the properties in the JSON.
    * @param {String} json
    */
   GAuth.inflate = function(json) {
      var options = JSON.parse(json);
      return function(auth) {
         for(var opt in options) {
            auth._configure(opt, options[opt]);
         }
      }
   };

   /**
    * Automatically persists to and inflates from a file at the named file path.
    * @param filePath
    */
   GAuth.filePersistence = function(filePath) {

      var FileSystem = require('fs');
      var options;
      if(FileSystem.existsSync(filePath)) {
         options = FileSystem.readFileSync(filePath, 'utf8');
      }

      return function(auth) {
         if(options) {
            GAuth.inflate(options)(auth);
         }

         process.on('exit', function() {
            FileSystem.writeFileSync(filePath, auth.serialize(), 'utf-8');
         });
      }
   };

   /**
    * Creates an Express compatible middleware component that will force all requests to have a user object on their
    * session. Note that session management is assumed and not implemented in this middleware, consider using
    * express.cookieParser and express.cookieSession before using this middleware.
    *
    * @param {Function} [getUserFn] When supplied, used as a validator of the user once validated by Google
    * @return {Function}
    */
   GAuth.prototype.middleware = function(getUserFn) {

      var googleAuth = this;

      var decodeResponse = function(url) {
         var response = /openid.ext1.value.email/.test(url) ? require('url').parse(url, true).query : {};
         for(var key in response) {
            response[key.replace(/^.*\./, '')] = response[key];
            delete response[key];
         }

         console.log('GAuth: decoding response from url ', url, response);
         return response;
      };

      return function(req, res, next) {

         var oAuthUser;

         // when no user attached - straight through to the login url
         if(!req.session.user && !(oAuthUser = decodeResponse(req.url)).email) {
            googleAuth.logIn(req.originalUrl).then(function(url) {console.log('GAuth: redirecting user to ', url); res.redirect(url)} );
            return;
         }

         // validated on this request, set as the user (optionally through the user authenticator)
         if(!req.session.user && oAuthUser.email) {
            if(getUserFn) {
               getUserFn(oAuthUser, function(err, user) {
                  if(err) {
                     next(err);
                  }
                  else {
                     req.session.user = user;
                     res.redirect(req.query.next);
                  }
               });
            }
            else {
               req.session.user = oAuthUser;
               res.redirect(req.query.next);
            }
            return;
         }

         // managed to get here - so not yet authenticated and no email was decoded
         if(!req.session.user) {
            next(new Error("Unable to authenticate user"));
            return;
         }

         // last but not least, session already has a user in it, so just head on with processing the request
         next();

      };
   };


   module.exports = GAuth;

}());
