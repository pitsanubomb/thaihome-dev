var express = require('express');
var router = express.Router();
var CurrencyDataController = require('../controllers/CurrencyDataController');

router.get('/getRates', function(req, res){
	CurrencyDataController.getRates(req, res);
});

module.exports = router;
