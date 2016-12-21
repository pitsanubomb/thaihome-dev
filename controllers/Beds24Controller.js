var Beds24 = require('../models/Beds24Data');
var Beds24Props = require('../models/Beds24Props');
var request = require('request');
var moment = require('moment');
var Property = require('../models/Property');
var Users = require('../models/Users');


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
                inspect(err, 'error posting json')
                return
            }
            Beds24Props.find({ key: 'ThaiHomeTestingWAT' }, function (err, data) {
                if (data.length != 0) {
                    var current = data[0];
                    current.rooms = JSON.parse(body).getProperty[0].roomTypes[0].unitNames.split("\r\n");
                    current.save(function (err, data) {
                        if (!err) {
                            console.log("DATA SAVED AS : ", data);
                        } else {
                            console.log("ERROR ON SAVING new PROP DATA : ", err);
                        }
                    });
                } else {
                    console.log("DATA FROM BEDS24Props: ", data);
                    console.log("BEDS21 result :", JSON.parse(body).getProperty[0].roomTypes[0].unitNames.split("\r\n"));
                    var newPropData = new Beds24Props({
                        roomId: JSON.parse(body).getProperty[0].roomTypes[0].roomId,
                        key: "ThaiHomeTestingWAT",
                        rooms: JSON.parse(body).getProperty[0].roomTypes[0].unitNames.split("\r\n")
                    });
                    newPropData.save(function (err, data) {
                        if (!err) {
                            console.log("DATA SAVED AS : ", data);
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
    }
    request(options, function (err, res, body) {
        if (err) {
            console.log("ERROR ON GETTING BOOKINGS DATA FROM BEDS25!!");
        }
        //console.log("BEDS21 result :", JSON.parse(body));
        var bookings = JSON.parse(body);
        if (bookings.length) {
            Beds24.find(function (err, data) {
                if (!err) {
                    function compareBooking(index) {
                        console.log("CURRENT BOOKING : " + index + " ", bookings[index]);
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
                                current[0].data.deposit == bookings[index].deposit
                            ) {
                                if ((index + 1) < bookings.length) {
                                    index++;
                                    compareBooking(index);
                                }
                            } else {
                                current[0].data = bookings[index];
                                current[0].save(function () {
                                    if (!err) {
                                        console.log('saved');
                                        if ((index + 1) < bookings.length) {
                                            index++;
                                            compareBooking(index);
                                        }
                                    } else {
                                        console.log("ERROR ON SAVING DATA FOR CURRENT0");
                                    }
                                })
                                console.log("IS NOT EQUAL!!! :", current[0].data.roomId, + ' ' + bookings[index].bookId);
                            }
                        } else {
                            Beds24Props.findOne({ roomId: bookings[index].roomId }, function (err, propData) {
                                if (!err) {
                                    console.log("PROPDATA: unit ", propData.rooms[bookings[index].unitId]);
                                    Property.findOne({ unique: propData.rooms[bookings[index].unitId] }, function (err, property) {
                                        if (!err) {
                                            console.log('REAL PROPERTY ID : ', property._id);
                                            Users.findOne({ email: bookings[index].guestEmail.trim() }, function (err, user) {
                                                if (!err) {
                                                    if (user == null) {
                                                        var newUserEmail = '';
                                                        if(bookings[index].guestFirstEmail != '' && typeof bookings[index].guestFirstEmail != 'undefined'){
                                                            newUserEmail = bookings[index].guestFirstEmail.trim();
                                                        }else{
                                                            newUserEmail = bookings[index].bookId + "bookid@notvalidemail.com";
                                                        }
                                                        var newUser = new Users({
                                                            username:newUserEmail, 
                                                            email: newUserEmail,
                                                            password: '',
                                                            name: bookings[index].guestFirstName.trim() + " " + bookings[index].guestName.trim(),
                                                            agent:'',
                                                            phone: bookings[index].guestPhone.trim(),
                                                            country: bookings[index].guestCountry.trim(),
                                                            type: 'tenant',
                                                            created: Math.round(new Date() / 1000)
                                                        });
                                                        console.log("CURRENT USER : : : ",  newUser);
                                                        newUser.save(function(err, user){
                                                            if(!err){
                                                                var url = 'http://localhost:3000/api/booking'
                                                                var options = {
                                                                    method: 'post',
                                                                    body: {
                                                                        "property": property._id,
                                                                        "user": user._id,
                                                                        "agentCommission": "",
                                                                        "discountPercentage": 0,
                                                                        "checkin": Math.round(new Date(bookings[index].firstNight) / 1000),
                                                                        "checkout": Math.round(new Date(bookings[index].firstNight) / 1000),
                                                                        "status": 0,
                                                                        "currency": "124486735576e9ff",
                                                                        "paymentType": 5,
                                                                        "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                        "priceDay": 2300,//
                                                                        "nights": 6,//
                                                                        "priceReservation": 0,
                                                                        "priceSecurity": 2000,//
                                                                        "cleanprice": 400,//
                                                                        "cleanfinalprice": 750,//
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

                                                            }else{
                                                                console.log('ERROR ON SAVING NEW USER DATA! :',err);
                                                            }
                                                        })
                                                    } else {
                                                        var url = 'http://localhost:3000/api/booking'
                                                        var options = {
                                                            method: 'post',
                                                            body: {
                                                                "property": property._id,
                                                                "user": user._id,
                                                                "agentCommission": "",
                                                                "discountPercentage": 0,
                                                                "checkin": Math.round(new Date(bookings[index].firstNight) / 1000),
                                                                "checkout": Math.round(new Date(bookings[index].firstNight) / 1000),
                                                                "status": 0,
                                                                "currency": "124486735576e9ff",
                                                                "paymentType": 5,
                                                                "expires": Math.round(new Date() / 1000 + 5 * 86400),
                                                                "priceDay": 2300,//
                                                                "nights": 6,//
                                                                "priceReservation": 0,
                                                                "priceSecurity": 2000,//
                                                                "cleanprice": 400,//
                                                                "cleanfinalprice": 750,//
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
                                    })

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
                    res.json({ error: false });
                } else {
                    res.json({ error: true })
                }
            });
        }
        console.log("BEDS21 result :", JSON.parse(body)[0]);
    });
}

exports.setBooking = function (req, res) {
    Beds24Props.findOne({ rooms: req.body.prop }, function (err, result) {
        if (!err) {
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
                body: "{\r\n \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n    \"roomId\": \" " + roomId + " \",\r\n    \"unitId\": \" " + unitId + "\",\r\n    \"firstNight\": \" " + req.body.checkin + "\",\r\n    \"lastNight\": \" " + req.body.checkout + "\",\r\n    \"guestFirstName\": \" " + userName + " \",\r\n    \"guestName\": \" " + userSurname + "\",\r\n    \"guestEmail\": \" " + req.body.userEmail + "\",\r\n    \"guestPhone\": \" " + req.body.userPhone + " \",\r\n    \"guestCountry\": \" " + req.body.userCountry + "\",\r\n    \"price\": \" " + req.body.totalPrice + "\",\r\n    \"deposit\": \" " + req.body.deposit + "\",\r\n    \"notifyUrl\": \"true\",\r\n    \"notifyGuest\": \"false\",\r\n    \"notifyHost\": \"false\",\r\n    \"assignBooking\": \"false\"\r\n                }",
                url: url
            };
            console.log("STATUS : ", status);
            request(options, function (err, result, body) {
                console.log(body);
                var id = JSON.parse(body).bookId;
                var th_id = req.body.th_id;
                var url = 'https://beds24.com/api/json/getBookings'
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
                            res.json({ error: false });
                        } else {
                            res.json({ error: true })
                        }
                    });
                });
            });
        } else {
            res.json({ error: true, message: "ERROR ON SELECTING PROPERTY!." })
        }
    });

}

exports.updateBooking = function (req, res) {
    Beds24Props.findOne({ rooms: req.body.prop }, function (err, result) {
        if (!err) {
            var roomUnique = req.body.prop;
            var propKey = result.key;
            var user = req.body.user.split(' ');
            var userSurname = user[1];
            var userName = user[0];
            var roomId = result.roomId;
            var status = 1;
            if(req.body.status == 6 || req.body.status == '6'){
                status =  0;
            }
            var unitId = result.rooms.indexOf(roomUnique) + 1;
            var url = 'https://beds24.com/api/json/setBooking';
            var th_id = req.body.th_id;
            Beds24.findOne({ th_id: th_id }, function (err, data) {
                var id = data.data.bookId;
                var url = 'https://beds24.com/api/json/setBooking'
                var options = {
                    method: 'post',
                    body: "{\r\n \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n    \"bookId\": \" " + id + "\",\r\n    \"roomId\": \" " + roomId + " \",\r\n    \"unitId\": \" " + unitId + "\",\r\n    \"firstNight\": \" " + req.body.checkin + "\",\r\n    \"status\": \"" + status + "\",\r\n    \"lastNight\": \" " + req.body.checkout + "\",\r\n    \"guestFirstName\": \" " + userName + " \",\r\n    \"guestName\": \" " + userSurname + "\",\r\n    \"guestEmail\": \" " + req.body.userEmail + "\",\r\n    \"guestPhone\": \" " + req.body.userPhone + " \",\r\n    \"guestCountry\": \" " + req.body.userCountry + "\",\r\n    \"price\": \" " + req.body.totalPrice + "\",\r\n    \"deposit\": \" " + req.body.deposit + "\",\r\n    \"notifyUrl\": \"true\",\r\n    \"notifyGuest\": \"false\",\r\n    \"notifyHost\": \"false\",\r\n    \"assignBooking\": \"false\"\r\n                }",
                    url: url
                };
                console.log("STATUS : ", status);
                request(options, function (err, result, body) {
                    console.log("DATA FOR BOOKING FROM BEDS24 :", body);
                    var urlGet = 'https://beds24.com/api/json/getBookings'
                    var options = {
                        method: 'post',
                        body: "{\r\n                    \"authentication\": {\r\n                        \"apiKey\": \"ThaiHomeTestingSync\",\r\n                        \"propKey\": \"" + propKey + "\"\r\n                    },\r\n                    \"bookId\": \" " + id + " \"\r\n                   \r\n                }",
                        url: urlGet
                    }
                    request(options, function (err, response, body) {
                        Beds24.findOne({ th_id: th_id }, function (err, data) {
                            data.data = JSON.parse(body)[0];
                            data.save(function (err, data) {
                                res.json({ error: false, data: data });
                            })
                        });
                    });
                });
            });
        } else {
            res.json({ error: true, message: "ERROR ON SELECTING PROP" })
        }
    });

}