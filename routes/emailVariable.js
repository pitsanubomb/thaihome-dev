var express = require('express');
var router = express.Router();
var EmailVariableController = require('../controllers/EmailVariableController');

router.post('/addVariable', function(req, res){
	EmailVariableController.addVariable(req, res);
});

router.get('/getVariables/:bookingId', function(req, res){
	EmailVariableController.getVariables(req, res);
});

router.get('/getVariablesForAdmin', function(req, res){
	EmailVariableController.getVariablesForAdmin(req, res);
});

router.post('/updateVariable/:id', function(req, res){
	EmailVariableController.updateVariable(req, res);
});

router.get('/deleteVariable/:id', function(req, res){
	EmailVariableController.deleteVariable(req, res);
});

module.exports = router;
