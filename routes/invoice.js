var express = require('express');
var router = express.Router();
var InvoiceController = require('../controllers/InvoiceController');

router.get('/getInvoicesBayDateRange', function(req, res, next) {
  InvoiceController.getInvoicesBayDateRange(req, res);
});

module.exports = router;
