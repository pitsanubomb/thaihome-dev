var Beds24 = require('../models/Beds24Data');
var Beds24Props = require('../models/Beds24Props');
var request = require('request');
var moment = require('moment');
var Property = require('../models/Property');
var Users = require('../models/Users');
var Price = require('../models/Price');
var fs = require('fs');
var lngFile = JSON.parse(fs.readFileSync('./languageToCountry.json', 'utf8'));

exports.getProperty = function () {
    var PropKeys = ['ThaiHomeTestingWAT'];
    for (var i = 0; i < PropKeys.length; i++) {
        var url = 'https://beds24.com/api/json/getProperty'
        var options = {
            method: 'post',
            body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + PropKeys[i] + "\"\r\n                    }\r\n    \r\n                }",
            url: url
        }
        request(options, function (err, res, body) {
            if (err) {
                console.log("error on getting properties");
                return
            }
            Beds24Props.find({key: 'ThaiHomeTestingWAT'}, function (err, data) {
                if (data.length != 0) {
                    var current = data[0];
                    current.rooms = JSON.parse(body).getProperty[0].roomTypes[0].unitNames.split("\r\n");
                    current.save(function (err, data) {
                        if (!err) {
                        } else {
                            console.log("ERROR ON SAVING new PROP DATA : ", err);
                        }
                    });
                } else {
                    var newPropData = new Beds24Props({
                        roomId: JSON.parse(body).getProperty[0].roomTypes[0].roomId,
                        key: "ThaiHomeTestingWAT",
                        rooms: JSON.parse(body).getProperty[0].roomTypes[0].unitNames.split("\r\n")
                    });
                    newPropData.save(function (err, data) {
                        if (!err) {
                        } else {
                            console.log("ERROR ON SAVING new PROP DATA : ", err);
                        }
                    })
                }
            })
        });
    }
}

exports.getBookings = function () {
    var url = 'https://beds24.com/api/json/getBookings'
    var options = {
        method: 'post',
        body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"ThaiHomeTestingWAT\"\r\n                    },\r\n                    \"includeInvoice\": false,\r\n                                        \"includeInfoItems\": false\r\n                }",
        url: url
    };

    function getCountryByCode(code) {
        var currentC = lngFile.filter(function (obj) {
            return obj.code == code;
        })[0];
        return currentC.country;
    };
    request(options, function (err, res, body) {
        if (err) {
            console.log("ERROR ON GETTING BOOKINGS DATA FROM BEDS25!!");
        }
        var bookings = JSON.parse(body);
        if (bookings.length) {

            Beds24.find(function (err, data) {
                if (!err) {
                    function compareBooking(index) {
                        var current = data.filter(function (obj) {
                            return obj.data.bookId == bookings[index].bookId;
                        });
                        if (current.length) {
                            if (current[0].data.roomId == bookings[index].roomId &&
                                current[0].data.unitId == bookings[index].unitId &&
                                current[0].data.firstNight == bookings[index].firstNight &&
                                current[0].data.lastNight == bookings[index].lastNight &&
                                current[0].data.guestFirstName == bookings[index].guestFirstName &&
                                current[0].data.guestName == bookings[index].guestName &&
                                current[0].data.guestEmail == bookings[index].guestEmail &&
                                current[0].data.guestPhone == bookings[index].guestPhone &&
                                current[0].data.guestCountry == bookings[index].guestCountry &&
                                current[0].data.price == bookings[index].price &&
                                current[0].data.deposit == bookings[index].deposit &&
                                current[0].data.guestArrivalTime == bookings[index].guestArrivalTime
                            ) {
                                if ((index + 1) < bookings.length) {
                                    index++;
                                    compareBooking(index);
                                }
                            } else {
                                current[0].data = bookings[index];
                                current[0].save(function () {
                                    if (!err) {
                                            Beds24Props.findOne({roomId: bookings[index].roomId}, function (err, propData) {
                                                if (!err) {
                                                    Property.findOne({unique: propData.rooms[bookings[index].unitId - 1]}, function (err, property) {
                                                        Price.findOne({property: property._id}, function (err, propPrice) {
                                                            if (!err) {
                                                                var checkin = Math.round(new Date(bookings[index].firstNight) / 1000);
                                                                var checkout = Math.round(new Date(bookings[index].lastNight) / 1000 + 86400);
                                                                var days = Math.round((checkout - checkin) / 86400);
                                                                var deposit = 0;
                                                                var price = 0;
                                                                var reservation = 0;
                                                                if (days < 7) {
                                                                    reservation = propPrice.PricereservationDay;
                                                                    price = propPrice.priceDay;
                                                                    deposit = propPrice.depositDay;
                                                                } else if (days < 30) {
                                                                    reservation = propPrice.PricereservationWeek;
                                                                    price = propPrice.priceWeek;
                                                                    deposit = propPrice.depositWeek;
                                                                } else if (days < 365) {
                                                                    reservation = propPrice.PricereservationMonth;
                                                                    price = propPrice.priceMonth;
                                                                    deposit = propPrice.depositMonth;
                                                                } else {
                                                                    reservation = propPrice.PricereservationYear;
                                                                    price = propPrice.priceYear;
                                                                    deposit = propPrice.depositYear;
                                                                }
                                                                var status = 0;
                                                                if (bookings[index].status == 0 || bookings[index].status == '0') {
                                                                    status = 6;
                                                                }
                                                                else if (bookings[index].status == 2 || bookings[index].status == '2') {
                                                                    status = 0;
                                                                }
                                                                else if (bookings[index].status == 1 || bookings[index].status == '1') {
                                                                    status = 2;
                                                                }
                                                                else if (bookings[index].status == 3 || bookings[index].status == '3') {
                                                                    status = 1;
                                                                }
                                                                Users.findOne({email: bookings[index].guestEmail.trim()}, function (err, user) {
                                                                    if (!err) {
                                                                        if (user == null) {
                                                                            var newUserEmail = '';
                                                                            if (bookings[index].guestEmail != '' && typeof bookings[index].guestEmail != 'undefined') {
                                                                                newUserEmail = bookings[index].guestEmail.trim();
                                                                            } else {
                                                                                newUserEmail = bookings[index].bookId + "bookid@notvalidemail.com";
                                                                            }
                                                                            function makeid() {
                                                                                var text = "";
                                                                                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                                                                for (var i = 0; i < 5; i++)
                                                                                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                                                                                return text;
                                                                            }

                                                                            var newUser = new Users({
                                                                                _id: makeid(),
                                                                                username: newUserEmail,
                                                                                email: newUserEmail,
                                                                                password: '',
                                                                                name: bookings[index].guestFirstName.trim() + " " + bookings[index].guestName.trim(),
                                                                                agent: '',
                                                                                phone: bookings[index].guestMobile.trim(),
                                                                                country: getCountryByCode(bookings[index].guestCountry2.trim()),
                                                                                type: 'tenant',
                                                                                created: Math.round(new Date() / 1000),
                                                                                lastContact: Math.round(new Date() / 1000)
                                                                            });
                                                                            newUser.save(function (err, user) {
                                                                                if (!err) {
                                                                                    var url = 'http://localhost:3000/api/booking';

                                                                                    var options = {
                                                                                        method: 'put',
                                                                                        body: {
                                                                                            "id":current[0].th_id,
                                                                                            "property": property._id,
                                                                                            "user": user._id,
                                                                                            "agentCommission": "",
                                                                                            "discountPercentage": 0,
                                                                                            "checkin": checkin,
                                                                                            "checkout": checkout,
                                                                                            "status": status,
                                                                                            "currency": "588a25ac3dd9c18b67717a5f",
                                                                                            "paymentType": 5,
                                                                                            "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                                            "priceDay": price,
                                                                                            "nights": days,
                                                                                            "priceReservation": reservation,
                                                                                            "priceSecurity": deposit,
                                                                                            "cleanprice": property.cleanprice,
                                                                                            "cleanfinalprice": property.cleanfinalprice,
                                                                                            "priceExtra": [],
                                                                                            "conditionsTenant": "Electric and Water, you have to pay for what you use. Wifi and Cable TV included and paid by us. ",
                                                                                            "created": Math.round(new Date() / 1000),
                                                                                            "rate": 1,
                                                                                            "pricePaid": 0,
                                                                                            "emails": [],
                                                                                            "rentpayday": 0,
                                                                                            "nextpayment": 0,
                                                                                            "source": "B",
                                                                                            "discountAmount": "",
                                                                                            "longTermDay": 1,
                                                                                            "longTermAmount": null,
                                                                                            "checked": false,
                                                                                            "paymentconfirmed": false,
                                                                                            "arrival":bookings[index].guestArrivalTime
                                                                                        },
                                                                                        url: url
                                                                                    };
                                                                                    options.body = JSON.stringify(options.body);
                                                                                    request(options, function (err, response, body) {
                                                                                        console.log("RESPONSE BOFY FROM API OF THAHIJOME: ", body);
                                                                                        var currentBooking = JSON.parse(body);
                                                                                        console.log("current booking id :", currentBooking.id);
                                                                                        var newBooking = new Beds24({
                                                                                            data: bookings[index],
                                                                                            th_id: currentBooking.id
                                                                                        });
                                                                                        newBooking.save(function (err, data) {
                                                                                            if (!err) {
                                                                                                console.log("saved a new booking with bookingId:", currentBooking);
                                                                                                if ((index + 1) < bookings.length) {
                                                                                                    index++;
                                                                                                    compareBooking(index);
                                                                                                }
                                                                                            }else{
                                                                                                console.log("ERROR ON UPDATING BOOKING");
                                                                                            }
                                                                                        });

                                                                                    })

                                                                                } else {
                                                                                    console.log('ERROR ON SAVING NEW USER DATA! :', err);
                                                                                }
                                                                            })
                                                                        }
                                                                        else {
                                                                            console.log("CURRENT BOOKING : ", bookings[index]);
                                                                            var url = 'http://localhost:3000/api/booking';
                                                                            var options = {
                                                                                method: 'put',
                                                                                body: {
                                                                                    "id":current[0].th_id,
                                                                                    "property": property._id,
                                                                                    "user": user._id,
                                                                                    "agentCommission": "",
                                                                                    "discountPercentage": 0,
                                                                                    "checkin": checkin,
                                                                                    "checkout": checkout,
                                                                                    "status": status,//
                                                                                    "currency": "588a25ac3dd9c18b67717a5f",
                                                                                    "paymentType": 5,
                                                                                    "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                                    "priceDay": price,
                                                                                    "nights": days,
                                                                                    "priceReservation": reservation,
                                                                                    "priceSecurity": deposit,
                                                                                    "cleanprice": property.cleanprice,
                                                                                    "cleanfinalprice": property.cleanfinalprice,
                                                                                    "priceExtra": [],
                                                                                    "conditionsTenant": "Electric and Water, you have to pay for what you use. Wifi and Cable TV included and paid by us. ",
                                                                                    "created": Math.round(new Date() / 1000),
                                                                                    "rate": 1,
                                                                                    "pricePaid": 0,
                                                                                    "emails": [],
                                                                                    "rentpayday": 0,
                                                                                    "nextpayment": 0,
                                                                                    "source": "B",
                                                                                    "discountAmount": "",
                                                                                    "longTermDay": 1,
                                                                                    "longTermAmount": null,
                                                                                    "checked": false,
                                                                                    "paymentconfirmed": false,
                                                                                    "arrival":bookings[index].guestArrivalTime
                                                                                },
                                                                                url: url
                                                                            };
                                                                            options.body = JSON.stringify(options.body);
                                                                            request(options, function (err, response, body) {
                                                                                var currentBooking = JSON.parse(body);
                                                                                var newBooking = new Beds24({
                                                                                    data: bookings[index],
                                                                                    th_id: currentBooking.id
                                                                                });
                                                                                newBooking.save(function (err, data) {
                                                                                    if (!err) {
                                                                                        console.log("updated  booking with bookingId:", currentBooking);
                                                                                        if ((index + 1) < bookings.length) {
                                                                                            index++;
                                                                                            compareBooking(index);
                                                                                        }
                                                                                    }else{
                                                                                        console.log("ERROR ON UPDATING BOOKING")
                                                                                    }
                                                                                });
                                                                            })
                                                                        }
                                                                    } else {
                                                                        console.log('ERROR ON SELECTING USER WITH EMAIL.');
                                                                    }
                                                                });
                                                            } else {
                                                                console.log('ERROR ON SELECTING PROPERTY WITH UNIQUE VALUE!!');
                                                            }
                                                        });


                                                    });

                                                } else {
                                                    console.log("ERROR ON SELECTING PROP BY ROOMID.");
                                                }
                                            });
                                    } else {
                                        index++;
                                        compareBooking(index);
                                    }
                                })
                                console.log("IS NOT EQUAL!!! :", current[0].data.roomId, +' ' + bookings[index].bookId);
                            }
                        } else {
                            Beds24Props.findOne({roomId: bookings[index].roomId}, function (err, propData) {
                                if (!err) {
                                    Property.findOne({unique: propData.rooms[bookings[index].unitId - 1]}, function (err, property) {
                                        Price.findOne({property: property._id}, function (err, propPrice) {
                                            if (!err) {
                                                var checkin = Math.round(new Date(bookings[index].firstNight) / 1000);
                                                var checkout = Math.round(new Date(bookings[index].lastNight) / 1000 + 86400);
                                                var days = Math.round((checkout - checkin) / 86400);
                                                var deposit = 0;
                                                var price = 0;
                                                var reservation = 0;
                                                if (days < 7) {
                                                    reservation = propPrice.PricereservationDay;
                                                    price = propPrice.priceDay;
                                                    deposit = propPrice.depositDay;
                                                } else if (days < 30) {
                                                    reservation = propPrice.PricereservationWeek;
                                                    price = propPrice.priceWeek;
                                                    deposit = propPrice.depositWeek;
                                                } else if (days < 365) {
                                                    reservation = propPrice.PricereservationMonth;
                                                    price = propPrice.priceMonth;
                                                    deposit = propPrice.depositMonth;
                                                } else {
                                                    reservation = propPrice.PricereservationYear;
                                                    price = propPrice.priceYear;
                                                    deposit = propPrice.depositYear;
                                                }
                                                var status = 0;
                                                if (bookings[index].status == 0 || bookings[index].status == '0') {
                                                    status = 6;
                                                }
                                                else if (bookings[index].status == 2 || bookings[index].status == '2') {
                                                    status = 0;
                                                }
                                                else if (bookings[index].status == 1 || bookings[index].status == '1') {
                                                    status = 2;
                                                }
                                                else if (bookings[index].status == 3 || bookings[index].status == '3') {
                                                    status = 1;
                                                }
                                                Users.findOne({email: bookings[index].guestEmail.trim()}, function (err, user) {
                                                    if (!err) {
                                                        if (user == null) {
                                                            var newUserEmail = '';
                                                            if (bookings[index].guestEmail != '' && typeof bookings[index].guestEmail != 'undefined') {
                                                                newUserEmail = bookings[index].guestEmail.trim();
                                                            } else {
                                                                newUserEmail = bookings[index].bookId + "bookid@notvalidemail.com";
                                                            }
                                                            function makeid() {
                                                                var text = "";
                                                                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                                                for (var i = 0; i < 5; i++)
                                                                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                                                                return text;
                                                            }

                                                            var newUser = new Users({
                                                                _id: makeid(),
                                                                username: newUserEmail,
                                                                email: newUserEmail,
                                                                password: '',
                                                                name: bookings[index].guestFirstName.trim() + " " + bookings[index].guestName.trim(),
                                                                agent: '',
                                                                phone: bookings[index].guestMobile.trim(),
                                                                country: getCountryByCode(bookings[index].guestCountry2.trim()),
                                                                type: 'tenant',
                                                                created: Math.round(new Date() / 1000),
                                                                lastContact: Math.round(new Date() / 1000)
                                                            });
                                                            newUser.save(function (err, user) {
                                                                if (!err) {
                                                                    var url = 'http://localhost:3000/api/booking';

                                                                    var options = {
                                                                        method: 'post',
                                                                        body: {
                                                                            "property": property._id,
                                                                            "user": user._id,
                                                                            "agentCommission": "",
                                                                            "discountPercentage": 0,
                                                                            "checkin": checkin,
                                                                            "checkout": checkout,
                                                                            "status": status,
                                                                            "currency": "588a25ac3dd9c18b67717a5f",
                                                                            "paymentType": 5,
                                                                            "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                            "priceDay": price,
                                                                            "nights": days,
                                                                            "priceReservation": reservation,
                                                                            "priceSecurity": deposit,
                                                                            "cleanprice": property.cleanprice,
                                                                            "cleanfinalprice": property.cleanfinalprice,
                                                                            "priceExtra": [],
                                                                            "conditionsTenant": "Electric and Water, you have to pay for what you use. Wifi and Cable TV included and paid by us. ",
                                                                            "created": Math.round(new Date() / 1000),
                                                                            "rate": 1,
                                                                            "pricePaid": 0,
                                                                            "emails": [],
                                                                            "rentpayday": 0,
                                                                            "nextpayment": 0,
                                                                            "source": "B",
                                                                            "discountAmount": "",
                                                                            "longTermDay": 1,
                                                                            "longTermAmount": null,
                                                                            "checked": false,
                                                                            "paymentconfirmed": false,
                                                                            "arrival":bookings[index].guestArrivalTime
                                                                        },
                                                                        url: url
                                                                    };
                                                                    options.body = JSON.stringify(options.body);
                                                                    request(options, function (err, response, body) {
                                                                        console.log("RESPONSE BOFY FROM API OF THAHIJOME: ", body);
                                                                        var currentBooking = JSON.parse(body);
                                                                        console.log("current booking id :", currentBooking.id);
                                                                        var newBooking = new Beds24({
                                                                            data: bookings[index],
                                                                            th_id: currentBooking.id
                                                                        });
                                                                        newBooking.save(function (err, data) {
                                                                            if (!err) {
                                                                                console.log("saved a new booking with bookingId:", bookings[index].bookId);
                                                                                if ((index + 1) < bookings.length) {
                                                                                    index++;
                                                                                    compareBooking(index);
                                                                                }
                                                                            }
                                                                        });

                                                                    })

                                                                } else {
                                                                    console.log('ERROR ON SAVING NEW USER DATA! :', err);
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            console.log("CURRENT BOOKING : ", bookings[index]);
                                                            var url = 'http://localhost:3000/api/booking';
                                                            var options = {
                                                                method: 'post',
                                                                body: {
                                                                    "property": property._id,
                                                                    "user": user._id,
                                                                    "agentCommission": "",
                                                                    "discountPercentage": 0,
                                                                    "checkin": checkin,
                                                                    "checkout": checkout,
                                                                    "status": status,//
                                                                    "currency": "588a25ac3dd9c18b67717a5f",
                                                                    "paymentType": 5,
                                                                    "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                    "priceDay": price,
                                                                    "nights": days,
                                                                    "priceReservation": reservation,
                                                                    "priceSecurity": deposit,
                                                                    "cleanprice": property.cleanprice,
                                                                    "cleanfinalprice": property.cleanfinalprice,
                                                                    "priceExtra": [],
                                                                    "conditionsTenant": "Electric and Water, you have to pay for what you use. Wifi and Cable TV included and paid by us. ",
                                                                    "created": Math.round(new Date() / 1000),
                                                                    "rate": 1,
                                                                    "pricePaid": 0,
                                                                    "emails": [],
                                                                    "rentpayday": 0,
                                                                    "nextpayment": 0,
                                                                    "source": "B",
                                                                    "discountAmount": "",
                                                                    "longTermDay": 1,
                                                                    "longTermAmount": null,
                                                                    "checked": false,
                                                                    "paymentconfirmed": false,
                                                                    "arrival":bookings[index].guestArrivalTime
                                                                },
                                                                url: url
                                                            };
                                                            options.body = JSON.stringify(options.body);
                                                            request(options, function (err, response, body) {
                                                                var currentBooking = JSON.parse(body);
                                                                var newBooking = new Beds24({
                                                                    data: bookings[index],
                                                                    th_id: currentBooking.id
                                                                });
                                                                newBooking.save(function (err, data) {
                                                                    if (!err) {
                                                                        console.log("saved a new booking with bookingId:", bookings[index]);
                                                                        if ((index + 1) < bookings.length) {
                                                                            index++;
                                                                            compareBooking(index);
                                                                        }
                                                                    }
                                                                });

                                                            })
                                                        }
                                                    } else {
                                                        console.log('ERROR ON SELECTING USER WITH EMAIL.');
                                                    }
                                                });
                                            } else {
                                                console.log('ERROR ON SELECTING PROPERTY WITH UNIQUE VALUE!!');
                                            }
                                        });


                                    });

                                } else {
                                    console.log("ERROR ON SELECTING PROP BY ROOMID.");
                                }
                            });
                        }
                    }

                    compareBooking(0);
                } else {
                    console.log('ERROR ON GETTING beds24DATA');
                }
            });
        }
    });
};

exports.setBookingWithId = function (id, th_id, resData) {

    var id = req.body.id;
    var th_id = req.body.th_id;
    var url = 'https://beds24.com/api/json/getBookings'
    var options = {
        method: 'post',
        body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"ThaiHomeTestingWAT\"\r\n                    },\r\n                    \"bookId\": \" " + id + " \"\r\n                   \r\n                }",
        url: url
    }
    request(options, function (err, res, body) {
        if (err) {
            inspect(err, 'error posting json')
            return
        } else {
            var newBooking = new Beds24({
                data: JSON.parse(body)[0],
                th_id: th_id
            });
            newBooking.save(function (err, date) {
                if (!err) {
                    res.json({error: false});
                } else {
                    res.json({error: true})
                }
            });
        }
        console.log("BEDS21 result :", JSON.parse(body)[0]);
    });
}

exports.setBooking = function (req, res) {
    Beds24Props.findOne({rooms: req.body.prop}, function (err, result) {
        if (!err && result != null) {
            console.log("RESULT FOR PROPES : ", result);
            var status = '';
            if (req.body.status == 6 || req.body.status == '6') {
                status = 0;
            }
            else if (req.body.status == 0 || req.body.status == '0') {
                status = 2;
            }
            else if (req.body.status == 1 || req.body.status == '1') {
                status = 2;
            }
            else if (req.body.status == 2 || req.body.status == '2') {
                status = 1;
            } else if (req.body.status == 3 || req.body.status == '3') {
                status = 1;
            } else {
                status = 3;
            }
            var roomUnique = req.body.prop;
            var propKey = result.key;
            var user = req.body.user.split(' ');
            var userSurname = user[1];
            var userName = user[0];
            var roomId = result.roomId;
            var unitId = result.rooms.indexOf(roomUnique) + 1;
            var url = 'https://beds24.com/api/json/setBooking';
            var options = {
                method: 'post',
                body: "{\r\n \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n    \"roomId\": \" " + roomId + " \",\r\n    \"unitId\": \" " + unitId + "\",\r\n    \"firstNight\": \" " + req.body.checkin + "\",\r\n    \"lastNight\": \" " + req.body.checkout + "\",\r\n    \"status\": \"" + status + "\",\r\n    \"guestFirstName\": \" " + userName + " \",\r\n    \"guestName\": \" " + userSurname + "\",\r\n    \"guestEmail\": \" " + req.body.userEmail + "\",\r\n    \"guestMobile\": \" " + req.body.userPhone + " \",\r\n    \"guestCountry2\": \" " + req.body.userCountry + "\",\r\n    \"price\": \" " + req.body.totalPrice + "\",\r\n    \"deposit\": \" " + req.body.deposit + "\",\r\n    \"notifyUrl\": \"true\",\r\n    \"notifyGuest\": \"false\",\r\n    \"notifyHost\": \"false\",\r\n    \"assignBooking\": \"false\"\r\n                }",
                url: url
            };
            request(options, function (err, result, body) {
                console.log(body);
                var id = JSON.parse(body).bookId;
                var th_id = req.body.th_id;
                var url = 'https://beds24.com/api/json/getBookings';
                var options = {
                    method: 'post',
                    body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"ThaiHomeTestingWAT\"\r\n                    },\r\n                    \"bookId\": \" " + id + " \"\r\n                   \r\n                }",
                    url: url
                }
                request(options, function (err, response, body) {
                    console.log("DATA FOR BOOKING FROM BEDS24 :", JSON.parse(body)[0]);
                    var newBooking = new Beds24({
                        data: JSON.parse(body)[0],
                        th_id: th_id
                    });
                    newBooking.save(function (err, data) {
                        if (!err) {
                            res.json({error: false});
                        } else {
                            res.json({error: true})
                        }
                    });
                });
            });
        } else {
            res.json({error: true, message: "ERROR ON SELECTING PROPERTY!."})
        }
    });

}

exports.updateBooking = function (req, res) {
    Beds24Props.findOne({rooms: req.body.prop}, function (err, result) {
        if (!err && result != null) {
            var roomUnique = req.body.prop;
            var propKey = result.key;
            var user = req.body.user.split(' ');
            var userSurname = user[1];
            var userName = user[0];
            var roomId = result.roomId;

            var unitId = result.rooms.indexOf(roomUnique) + 1;
            var url = 'https://beds24.com/api/json/setBooking';
            var th_id = req.body.th_id;
            Beds24.findOne({th_id: th_id}, function (err, data) {
                var status = '';
                if (req.body.status == 6 || req.body.status == '6') {
                    status = 0;
                }
                else if (req.body.status == 0 || req.body.status == '0') {
                    status = 2;
                }
                else if (req.body.status == 1 || req.body.status == '1') {
                    status = 2;
                }
                else if (req.body.status == 2 || req.body.status == '2') {
                    status = 1;
                } else if (req.body.status == 3 || req.body.status == '3') {
                    status = 1;
                } else {
                    status = 3;
                }
                var id = data.data.bookId;
                var url = 'https://beds24.com/api/json/setBooking'
                var options = {
                    method: 'post',
                    body: "{\r\n \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n    \"bookId\": \"" + id + "\",\r\n    \"roomId\": \"" + roomId + "\",\r\n    \"unitId\": \" " + unitId + "\",\r\n    \"firstNight\": \" " + req.body.checkin + "\",\r\n    \"status\": \"" + status + "\",\r\n    \"lastNight\": \" " + req.body.checkout + "\",\r\n    \"guestFirstName\": \" " + userName + " \",\r\n    \"guestName\": \"" + userSurname + "\",\r\n    \"guestEmail\": \"" + req.body.userEmail + "\",\r\n    \"guestMobile\": \"" + req.body.userPhone + "\",\r\n    \"guestCountry2\": \"" + req.body.userCountry + "\",\r\n    \"price\": \"" + req.body.totalPrice + "\",\r\n    \"deposit\": \"" + req.body.deposit + "\",\r\n    \"notifyUrl\": \"true\",\r\n    \"notifyGuest\": \"false\",\r\n    \"notifyHost\": \"false\",\r\n    \"assignBooking\": \"false\"\r\n                }",
                    url: url
                };
                request(options, function (err, result, body) {
                    console.log("DATA FOR BOOKING FROM BEDS24 :", body);
                    var urlGet = 'https://beds24.com/api/json/getBookings'
                    var options = {
                        method: 'post',
                        body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n                    \"bookId\": \" " + id + " \"\r\n                   \r\n                }",
                        url: urlGet
                    }
                    request(options, function (err, response, body) {
                        Beds24.findOne({th_id: th_id}, function (err, data) {
                            data.data = JSON.parse(body)[0];
                            data.save(function (err, data) {
                                res.json({error: false, data: data});
                            })
                        });
                    });
                });
            });
        } else {
            res.json({error: true, message: "ERROR ON SELECTING PROP"})
        }
    });

}