var express = require('express');
var router = express.Router();
var TodosController = require('../controllers/TodosController');

router.get('/getTodos', function(req, res){
	TodosController.getTodos(req, res);
});

module.exports = router;
