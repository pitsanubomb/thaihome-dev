var Invoice = require('../models/invoice');
var Bookings = require('../models/Booking');

exports.getInvoicesBayDateRange = function (req, res) {
    Invoice.find({
        $where: function () {
            var date = new Date(this.dueDate);
            return (date <= new Date((Math.round(new Date() / 1000) + 604800 ) * 1000)) && this.paidDate == ''
        }
    }, function (err, invoices) {
        if (!err) {
            var bookingIds = [];

            for (var i = 0; i < invoices.length; i++) {
                bookingIds.push(invoices[i].bookingId);
            }
            Bookings.aggregate(
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "userData"
                    }
                }, {
                    $match: {
                        $and: [{"_id": {$in: bookingIds}}]
                    }
                }, {$project: {_id: 1, userData: 1}}

                , function (err, users) {
                    if(!err){
                        var inv = [];
                        for (var q = 0; q < invoices.length; q++){
                            var current = users.filter(function(obj){
                                return obj._id == invoices[q].bookingId;
                            });
                            inv.push({
                                _id: invoices[q]._id,
                                invoiceNumber: invoices[q].invoiceNumber,
                                bookingId: invoices[q].bookingId,
                                propertyId: invoices[q].propertyId,
                                createDate: invoices[q].createDate,
                                dueDate: invoices[q].dueDate,
                                paidDate: invoices[q].paidDate,
                                paymentSuggest: invoices[q].paymentSuggest,
                                managerId: invoices[q].managerId,
                                invoiceLines: invoices[q].invoiceLines,
                                includeMissing: invoices[q].includeMissing,
                                username: current[0].userData[0].name
                            });
                            if(q == invoices.length - 1){
                                res.json({error:false,data:inv});
                            }
                        }
                    }else{
                        res.json({error:true});
                    }
                })
        } else {
            res.json({error: true, message: err});
        }
    })
};
