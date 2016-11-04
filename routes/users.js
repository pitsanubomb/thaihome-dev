var express = require('express');
var router = express.Router();
var UsersController = require('../controllers/UsersController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/getAdmins', function(req, res){
	UsersController.getAdmins(req, res);
});

module.exports = router;
