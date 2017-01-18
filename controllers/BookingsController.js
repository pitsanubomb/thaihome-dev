/**
 * Created by armsofter on 1/14/17.
 */
var Bookings = require('../models/Booking');

exports.getBookingsForProperty = function(req, res){
    Bookings.find({property:req.body.property}, function(err, data){
        if(!err){
            res.json({error:false, bookings:data});
        }else{
            res.json({error:true, message:"Error on selecting all bookings of this property."});
        }
    });
};