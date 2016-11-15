var express = require('express');
var router = express.Router();
var CheckListController = require('../controllers/CheckListController');

router.get('/getCheckListByProperty/:property', function(req, res){
	CheckListController.getCheckListByProperty(req, res);
});

module.exports = router;
