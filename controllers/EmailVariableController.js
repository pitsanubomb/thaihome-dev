var EmailVariable = require('../models/EmailVariables');
var Booking = require('../models/Booking');
var User = require('../models/Users');
var Property = require('../models/Property');
var Currency = require('../models/Currency')
var CurrenctData = require('../models/CurrencyData');
var moment = require('moment');
var Recipt = require('../models/Receipt');
var Invoice = require('../models/invoice');
var Price = require('../models/Price');
require("moment-duration-format");
var _ = require('lodash');

exports.getVariables = function (req, res) {
    var convertedVariables = {};
    Booking.findOne({_id: req.params.bookingId}, function (err, booking) {
        Invoice.find({bookingId: req.params.bookingId}, function (err, invoices) {
            Recipt.find({bookingId: req.params.bookingId}, function (err, receipts) {
                var invoicesAmount = 0;
                for (var i = 0; i < invoices.length; i++) {
                    for (var k = 0; k < invoices[i].invoiceLines.length; k++) {
                        invoicesAmount += invoices[i].invoiceLines[k].amountTotal;
                    }
                }
                var receiptsAmount = 0;
                for (var j = 0; j < receipts.length; j++) {
                    receiptsAmount += receipts[j].amount;
                }
                if (!err) {
                    EmailVariable.find(function (err, variables) {
                        if (!err) {
                            Currency.findOne({_id: booking.currency}, function (err, currency) {
                                console.log("CURRENCY OF BOOKING : ", currency);
                                if (!err) {
                                    User.find({_id: booking.user}, function (err, user) {
                                        if (!err) {
                                            Property.findOne({_id: booking.property}, function (err, property) {
                                                if (!err) {
                                                    Price.findOne({property: property._id}, function (err, propPrice) {
                                                        if (!err) {
                                                            CurrenctData.find(function (err, Cdata) {
                                                                var totalPriceBooking = 0;
                                                                if(booking.discountAmount > 0){
                                                                    booking.discountAmount = booking.discountAmount * -1
                                                                }
                                                                var formatMoney = function (n, c, d, t) {
                                                                    var c = isNaN(c = Math.abs(c)) ? 2 : c,
                                                                        d = d == undefined ? "." : d,
                                                                        t = t == undefined ? "," : t,
                                                                        s = n < 0 ? "-" : "",
                                                                        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
                                                                        j = (j = i.length) > 3 ? j % 3 : 0;
                                                                    console.log(s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : ""), "FORMATTED NUMBER");
                                                                    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
                                                                };

                                                                var secondPriceRate = JSON.parse(Cdata[0].data).rates[currency.currency];

                                                                var totalPriceBooking = booking.nights * booking.priceDay;
                                                                if(booking.discountPercentage){
                                                                    totalPriceBooking = totalPriceBooking - (totalPriceBooking / 100 * booking.discountPercentage)
                                                                }
                                                                function bothPrices(price, format){
                                                                    if(currency.currency == 'THB'  || format == 'left'){
                                                                        console.log(" PRICE LEFT : ", String( "฿  " + price));
                                                                        return String( "฿  " + price);
                                                                    }else if(typeof format == 'undefined'){
                                                                        return String( "฿  " + price + ' (' + currency.symbol + ' ' + Math.round(price * secondPriceRate) + ') ' );
                                                                    }else{
                                                                        if(format == 'both'){
                                                                            return String( "฿  " + price + ' (' + currency.symbol + ' ' + Math.round(price * secondPriceRate) + ') ' );
                                                                        }else{
                                                                            return String( currency.symbol + ' ' + Math.round(price * secondPriceRate));
                                                                        }
                                                                    }
                                                                }

                                                                var PriceExtra = 0;
                                                                var PriceExtraHTML = '';
                                                                _.each(booking.priceExtra, function (extra) {
                                                                    PriceExtra = parseFloat(PriceExtra) + parseFloat(extra.price);
                                                                    PriceExtraHTML += '<tr>';
                                                                    PriceExtraHTML += '<td style="padding: 5px 0 0 0;border-bottom: 1px solid #ddd;width: 90px;font-family: arial,sans-serif;font-size:14px;">' + extra.name + '</td><td style="padding: 5px 0 0 0;border-bottom: 1px solid #ddd;width: 90px;font-family: arial,sans-serif;text-align:right;"><b style="font-size:14px">' + bothPrices((extra.price * booking.rate).toFixed(0), 'right' ) + '</b></td>';
                                                                    PriceExtraHTML += '</tr>';
                                                                });

                                                                console.log("ALL VARIABLES  : ", eval('bothPrices(totalPriceBooking)'));
                                                                var x = [];
                                                                var a = moment.duration(booking.nights, "days").format('Y,M,W,D');
                                                                var arr = a.split(',');
                                                                arr = arr.reverse();
                                                                if (arr[3] > 0) {
                                                                    x.push(arr[3] + ' ' + (arr[3] > 1 ? 'years' : 'year'));
                                                                }
                                                                if (arr[2] > 0) {
                                                                    x.push(arr[2] + ' ' + (arr[2] > 1 ? 'months' : 'month'));
                                                                }
                                                                if (arr[1] > 0) {
                                                                    x.push(arr[1] + ' ' + (arr[1] > 1 ? 'weeks' : 'week'));
                                                                }
                                                                if (arr[0] > 0) {
                                                                    x.push(arr[0] + ' ' + (arr[0] > 1 ? 'days' : 'day'));
                                                                }
                                                                var PERIOD = x.join(', ');
                                                                user = user[0];

                                                                function GenerateVariables(func, condition, def) { //add value for defoult
                                                                    var funcFromData = func;
                                                                    //console.log('condition:',funcFromData);
                                                                    if (condition != '') {
                                                                        if(condition == "bothPrices(totalPriceBooking)"){
                                                                            console.log("CONDITION AREA : " , eval(condition));
                                                                        }
                                                                        if (eval(condition)) {
                                                                            return eval(funcFromData);
                                                                        } else {
                                                                            return eval(def);
                                                                        }
                                                                    } else {
                                                                        return eval(funcFromData);
                                                                    }
                                                                };
                                                                for (var i = 0; i < variables.length; i++) {
                                                                    convertedVariables[variables[i].variable] = GenerateVariables(variables[i].func, variables[i].condition, variables[i].default);
                                                                }
                                                                console.log(":: both totals :: ",convertedVariables['TOTAL_PRICE_BOOKING']);
                                                                res.json({error: false, data: convertedVariables});
                                                            });
                                                        } else {
                                                            res.json({
                                                                error: true,
                                                                message: "Error on selecting email variables."
                                                            });
                                                        }
                                                    });
                                                } else {
                                                    res.json({error: true, message: err});
                                                }
                                            });
                                        } else {
                                            res.json({error: true, message: err});
                                        }
                                    });
                                } else {
                                    console.log("error: ", err);
                                    res.json({error: true, message: "Error on selecting email variables."});
                                }
                            })
                        } else {
                            res.json({error: true, message: "Error on selecting email variables."});
                        }
                    });
                } else {
                    res.json({error: true, message: err})
                }
            });


        });

    });
}

exports.addVariable = function (req, res) {
    var newVariable = new EmailVariable({
        variable: req.body.variable,
        func: req.body.func,
        condition: req.body.condition,
        default: req.body.default
    });
    newVariable.save(function (err, data) {
        if (!err) {
            res.json({error: false, data: data});
        } else {
            res.json({error: true, err: data});
        }
    });
};

exports.updateVariable = function (req, res) {
    if (typeof req.params.id != 'undefined' && typeof req.body.variable != 'undefined') {
        EmailVariable.findOne({_id: req.params.id}, function (err, result) {
            if (!err) {
                result.variable = req.body.variable;
                result.func = req.body.func;
                result.condition = req.body.condition;
                result.default = req.body.default;
                result.save(function (err, data) {
                    if (!err) {
                        res.json({error: false, data: data});
                    } else {
                        res.json({error: true, message: "error on saveing modified variable."})
                    }
                });
            } else {
                res.json({error: true, message: "error on selecting variable"})
            }
        });
    } else {
        res.json({error: true, message: "Invalid credientals for update"})
    }
};

exports.getVariablesForAdmin = function (req, res) {
    EmailVariable.find(function (err, variables) {
        if (!err) {
            res.json({error: false, data: variables});
        } else {
            res.json({error: true, message: "Error on selecting variables."});
        }
    });
};

exports.deleteVariable = function (req, res) {
    if (typeof req.params.id != 'undefined') {
        EmailVariable.remove({_id: req.params.id}, function (err, result) {
            if (!err) {
                res.json({error: false, message: "Deleted"});
            } else {
                res.json({error: true, message: "error on deleting variable"});
            }
        });
    } else {
        res.json({error: true, message: "Invalid credientasl for deleting variable with ID."});
    }
};

