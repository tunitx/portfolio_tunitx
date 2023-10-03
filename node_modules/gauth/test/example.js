
var GoogleAuth = require('../src/index.js');

var googleAuth = new GoogleAuth(
    GoogleAuth.configure('base.url', 'http://localhost/openid/return.php'),
    GoogleAuth.filePersistence(__dirname + '/.googleauth'));


googleAuth.logIn('http://localhost/posts/NTE/dfgdfg-d-gdfgd')
    .then(console.log.bind(console));

