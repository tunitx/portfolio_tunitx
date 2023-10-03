var TestCase = require('unit-test').TestCase,
   Assertions = require('unit-test').Assertions,
   sinon = require('unit-test').Sinon,
   FileSystem = require('fs'),
   Express = require('express'),
   GoogleAuth = require('../src/index'),
   Promise = require('promise-lite').Promise,
   XHR = require('xhrequest');

var persistenceFilePath = __dirname + '/.googleauth';

var express;
var googleAuth;
var middleware;
var promise;
var mainRoute;
var testPort;

module.exports = new TestCase('Middleware', {

   setUp: function () {
      promise = new Promise;

      googleAuth = new GoogleAuth(
         GoogleAuth.configure('base.url', 'http://localhost:8989/openid/responder'),
         GoogleAuth.filePersistence(persistenceFilePath));

      middleware = googleAuth.middleware();

      googleAuth.on('ready', promise.resolve.bind(promise));

      express = Express();
      express.use(Express.cookieParser('some secret'));
      express.use(Express.cookieSession({key: 'iveGotThe', secret: Date.now() + '_my_secret'}));
      express.use(middleware);
      express.get('/', mainRoute = sinon.spy(function(req, res, next) {
         res.send({ query: req.query, params: req.params, url: req.url, user: req.session.user });
      }));
      express.server = express.listen(0, function() {
         testPort = express.server.address().port;
      });
   },

   tearDown: function () {
      express.server.close();

      try {
         FileSystem.unlinkSync(persistenceFilePath);
      }
      catch (e) {}
   },

   'test Can make a request to the server': function(done) {
      promise.done(function () {
         XHR('http://localhost:' + testPort, {
            complete: function (xhr) {
               Assertions.assertEquals(302, xhr.statusCode, "Request without authentication data should be redirected");
               done();
            }
         });
      });
   }
});
