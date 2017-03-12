var express = require('express');
var router = express.Router();
var Booking = require('../models/Booking');
var omise = require('omise')({
	  'secretKey': 'skey_test_55ma3s24i3dgnas0i8a'
	});

router.post('/charge', function(req, res){
	console.log('BODY :', req.body);
	Booking.findOne({_id:req.body.bookingId}, function(err, currentBooking){
		currentBooking.paymentType = 1;
		currentBooking.status = 1;
		currentBooking.save();
	});

	console.log(" AMOUNT : ", req.body.amount);

    omise.charges.create({
        'description': 'Charge for order ID: ' + req.body.bookingId,
        'amount': Number(req.body.amount) * 100,
        'currency': "thb",
        'card': req.body.omise_token,
        'capture': true,
        'return_uri':"http://191.101.12.128:3000/booking/"+ req.body.bookingId
    }, function(err, resp) {
        if(err){
            console.log("error : ", err, "RESP :", resp);
            res.redirect("http://191.101.12.128:3000/booking/"+ req.body.bookingId + "/card_error" );
        }else{
            console.log("OMISE : ", resp);
            res.redirect(resp.authorize_uri);
        }

    });


});

module.exports = router;
