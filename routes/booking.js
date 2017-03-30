var express = require('express');
var router = express.Router();
var Beds24Controller = require('../controllers/Beds24Controller');
var BookingsController = require('../controllers/BookingsController');


router.post('/setBookingWithId', function(req, res){
	Beds24Controller.setBookingWithId(req, res);
});

router.post('/setBooking', function(req, res){
	Beds24Controller.setBooking(req, res);
});

router.post('/updateBooking', function(req, res){
	Beds24Controller.updateBooking(req, res);
});

router.post('/getBookingsForProperty', function(req, res){
    BookingsController.getBookingsForProperty(req, res);
});
router.get('/getCheckinCheckount', function(req, res){
    BookingsController.getCheckinCheckount(req, res);
});




module.exports = router;
