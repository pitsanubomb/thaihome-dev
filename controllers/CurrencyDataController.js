var CurrencyData = require('../models/CurrencyData');
var request = require('request');

exports.getRates = function(){
    request('http://www.apilayer.net/api/live?access_key=e8aff3413aa473adca5877468d1fbdb1',
     function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);

            var THBUSD = (1/data.quotes.USDTHB).toFixed(5);

            var converted = {};
            for(key in data.quotes){
                converted[key.substring(3)] = (data.quotes[key] * THBUSD).toFixed(5);
            }
            var newCurrencyData = CurrencyData({
                date:Math.round(new Date() / 1000),
                data:JSON.stringify({base:'THB',date:new Date(), rates:converted})
            });

            newCurrencyData.save(function(err, result){
                if(!err){
                    CurrencyData.find(function(err, data){
                        for(var i = 0; i < data.length - 1; i++){
                                data[i].remove();
                        }
                    });

                    console.log("Saving the rates...");
                }else{
                    console.log("ERROR ON SAVING RATES!!");
                }
            });
        }
    })
};