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

router.get('/getAdminsAndManagers', function(req, res){
	UsersController.getAdminsAndManagers(req, res);
});

router.get('/getAdminsAndManagersAndTranslators', function(req, res){
	UsersController.getAdminsAndManagersAndTranslators(req, res);
});

router.post('/getUsersByMultipleIds', function(req, res){
	UsersController.getUsersByMultipleIds(req, res);
});

module.exports = router;
