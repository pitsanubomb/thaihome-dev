var express = require('express');
var router = express.Router();
var CheckListController = require('../controllers/CheckListController');

router.get('/getCheckListByProperty/:property', function(req, res){
	CheckListController.getCheckListByProperty(req, res);
});

router.post('/copyChecklistForProperty', function(req, res){
	CheckListController.copyChecklistForProperty(req, res);
});

module.exports = router;
