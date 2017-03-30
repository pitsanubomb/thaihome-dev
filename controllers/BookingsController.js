/**
 * Created by armsofter on 1/14/17.
 */
var Bookings = require('../models/Booking');

exports.getBookingsForProperty = function (req, res) {
    Bookings.find({property: req.body.property}, function (err, data) {
        if (!err) {
            res.json({error: false, bookings: data});
        } else {
            res.json({error: true, message: "Error on selecting all bookings of this property."});
        }
    });
};

exports.getCheckinCheckount = function (req, res) {
    var bookings = {
        checkinToday:'',
        checkinTomorrow: '',
        checkoutToday: '',
        checkoutTomorrow: ''
    };
    Bookings.aggregate(
        {$match: {$and: [{checkin: {$gte: Math.round(new Date() / 1000) - 86400, $lte: Math.round(new Date() / 1000) + 86400}},{status:{$lt:5}}]}}
        , function(err, checkinTd){
            if(!err){
                bookings.checkinToday = checkinTd;
                Bookings.aggregate(
                    {$match: { $and: [ {checkin: {$gte: Math.round(new Date() / 1000) + 86400, $lte: Math.round(new Date() / 1000) + 86400 * 2}}, {status:{$lt:5}}] }}
                    , function(err, checkinTm){
                        if(!err){
                            bookings.checkinTomorrow = checkinTm;
                            Bookings.aggregate(
                                {$match: {$and: [{checkout: {$gte: Math.round(new Date() / 1000) - 86400, $lte: Math.round(new Date() / 1000) + 86400}},{status:{$lt:5}}]}}
                                , function(err, checkoutTd){
                                    if(!err){
                                        bookings.checkoutToday = checkoutTd;
                                        Bookings.aggregate(
                                            {$match: { $and: [ {checkout: {$gte: Math.round(new Date() / 1000) + 86400, $lte: Math.round(new Date() / 1000) + 86400 * 2}}, {status:{$lt:5}}] }}
                                            , function(err, checkoutTm){
                                                if(!err){
                                                    bookings.checkoutTomorrow = checkoutTm;
                                                    res.json({error:false, bookings:bookings});
                                                }else{
                                                    res.json({error:true});
                                                }
                                            }
                                        )
                                    }else{
                                        res.json({error:true});
                                    }
                                }
                            )


                        }else{
                            res.json({error:true});
                        }
                    }
                )


            }else{
                res.json({error:true});
            }
        }
    )
};
