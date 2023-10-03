/**
 * @exports User
 */
(function () {

   "use strict";

   /**
    *
    * @name User
    * @constructor
    */
   function User(email) {
      this.email = email;
   }
   
   /**
    * @type {String} The email address of the user
    */
   User.prototype.email = null;

   module.exports = User;

}());
