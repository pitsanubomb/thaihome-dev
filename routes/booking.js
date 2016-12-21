var express = require('express');
var router = express.Router();
var Beds24Controller = require('../controllers/Beds24Controller');


router.post('/setBookingWithId', function(req, res){
	Beds24Controller.setBookingWithId(req, res);
});

router.post('/setBooking', function(req, res){
	Beds24Controller.setBooking(req, res);
});

router.post('/updateBooking', function(req, res){
	Beds24Controller.updateBooking(req, res);
});




module.exports = router;
