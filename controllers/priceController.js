
// Global Price Controller
// This controller will return the correct price data for any property
// POST INPUT:
// - property ID  (_id from property table)
// - checkin date (unix format)
// - checkout date (unix format)
// OUTPUT:
// - Json structure with all price data 
//

var mongoose = require('mongoose');

exports.getPrice = function(req, res){

    // 
    // Validate the data we get from router
    // 
	// console.log("priceController received: " + JSON.stringify(req.body, null, 4));
	// console.log("propertyID: " +req.body.propertyID);
	// console.log("checkin: " +req.body.checkin);
	// console.log("checkout: " +req.body.checkout);

	// if property is missing
	if (!req.body.propertyID) {
        console.log('propertyID missing in call of getPrice');
        res.json({error:true, message:'propertyID missing in call of getPrice'});
        return;
	} else {
	    var propertyID = req.body.propertyID;
	}
	
	// if checkin is missing
	if (req.body.checkin) {
	    var checkin = new Date(req.body.checkin*1000);
	} else {
		var checkin = new Date();
	}
	
	// if checkout is missing
	if (req.body.checkout) {
	    var checkout = new Date(req.body.checkout*1000);
		if (checkout.getTime() < checkin.getTime()) {
			let newCheckout = new Date(checkin);
			checkout = new Date(newCheckout.setDate(newCheckout.getDate() + 1));
		}
	} else {
		let newCheckout = new Date(checkin);
		var checkout = new Date(newCheckout.setDate(newCheckout.getDate() + 1));
	}



    // 
    // Find the PRICE for the property
    // 
	var priceModel = require('../models/priceModel');
    var priceTable = mongoose.model('priceModel');
    var findPrice = new Promise(
        (resolve, reject) => {
		priceTable.findOne(
			{ _id: propertyID } 
        ,function(err, data) {
            if (!err) {
                resolve(data);
            } else {
                reject(new Error('findPrice ERROR : ' + err));
            }
        });
	});



    // 
    // Find all SEASON 
    // 
	var seasonModel = require('../models/seasonModel');
    var seasonTable = mongoose.model('seasonModel');
    var findSeason = new Promise(
        (resolve, reject) => {
        seasonTable.aggregate([
        {
            $match:{}
        },
        {
            $project:{"_id":0, "from":1, "to":1, "pct":1}
        }
        ],function(err, data) {
            if (!err) {
                resolve(data);
            } else {
                reject(new Error('findSeason ERROR : ' + err));
            }
        });
    });



    // 
    // Find HOTDEAL 
    // 
	var hotdealModel = require('../models/hotdealModel');
    var hotdealTable = mongoose.model('hotdealModel');
    var findHotdeal = new Promise(
        (resolve, reject) => {
        hotdealTable.aggregate([
        {
            $match:{
				$and:[
					{ property : propertyID },
					{ start    : {$lte: checkin.getTime()} },
					{ end      : {$gte: checkout.getTime()} },
					{ active   : true }
				]
			}
        },
        {
            $project:{"_id":0, "discount":1, "start":1, "end":1, "hot":1, "active":1}
        }
        ],function(err, data) {
            if (!err) {
                resolve(data);
            } else {
                reject(new Error('findHotdeal ERROR : ' + err));
            }
        });
    });



    // 
    // Calculate the price based on all data 
    // 
	var calculatePrice = function ([priceArray, seasonArray, hotdealArray]) {
	    // console.log("findPrice Result: " + JSON.stringify(priceArray, null, 4));
	    // console.log("findSeason Result: " + JSON.stringify(seasonArray, null, 4));
	    // console.log("findHotdeal Result: " + JSON.stringify(hotdealArray, null, 4));
		console.log("checkin: " +checkin);
		console.log("checkout: " +checkout);

		//Calculate nights
		var nights = daysBetween(checkin, checkout)

		//Calculate prices from checkin to checkout
		var pricePrev  = 0;
		var priceNext  = 0;
		var price      = 0;
		var totalPrice = 0;
		var finalPriceNight = 0;
		
		if (nights<=7) {
			for (var i=0; i<nights; i++) {
				var chkDate = new Date(checkin);
				chkDate.setDate(chkDate.getDate() + i);
				if (chkDate.getDay() == 5 || chkDate.getDay() == 6) {
					totalPrice += priceArray.priceWeekend
				} else {
					totalPrice += priceArray.priceWeek1
				}
			} 
		} else if (nights>7 && nights<=14) {
			pricePrev  = priceArray.priceWeek1 * 7
			priceNext  = priceArray.priceWeek2 * 14
			price      = ((priceNext-pricePrev)/7);
			totalPrice = pricePrev + (price * (nights-7)) 
			
		} else if (nights>14 && nights<=21) {
			pricePrev = priceArray.priceWeek2 * 14
			priceNext = priceArray.priceWeek3 * 21
			price = ((priceNext-pricePrev)/(14-7));
			totalPrice = pricePrev + (price * (nights-14)) 
			
		} else if (nights>21 && nights<=30) {
			pricePrev = priceArray.priceWeek3 * 21
			priceNext = priceArray.priceMonth1 * 30
			price = Math.round((priceNext-pricePrev)/(30-21));
			totalPrice = pricePrev + (price * (nights-21)) 
			
		} else if (nights>30 && nights<=60) {
			pricePrev = priceArray.priceMonth1 * 30
			priceNext = priceArray.priceMonth2 * 60
			price = Math.round((priceNext-pricePrev)/(60-30));
			totalPrice = pricePrev + (price * (nights-30)) 
			
		} else if (nights>60 && nights<=90) {
			pricePrev = priceArray.priceMonth2 * 60
			priceNext = priceArray.priceMonth3 * 90
			price = Math.round((priceNext-pricePrev)/(90-60));
			totalPrice = pricePrev + (price * (nights-60)) 
			
		} else if (nights>90 && nights<=180) {
			pricePrev = priceArray.priceMonth3 * 90
			priceNext = priceArray.priceMonth6 * 180
			price = Math.round((priceNext-pricePrev)/(180-90));
			totalPrice = pricePrev + (price * (nights-90)) 
			
		} else if (nights>180) {
			pricePrev = priceArray.priceMonth6 * 180
			priceNext = priceArray.priceYear * 360
			price = Math.round((priceNext-pricePrev)/(360-180));
			totalPrice = pricePrev + (price * (nights-180)) 
		}

		//Calculate Seasons to add/deduct from prices
		var avgPrice   = Math.round(totalPrice/nights);
		var finalPrice = 0;
		var dn 		   = 0;
		for (var d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
			dn = Number((d.getMonth()+1) + ('0' + d.getDate()).slice(-2)) 
			var season = seasonArray.find(item => {
				return item.from <= dn && item.to >= dn
			});
			var pct = season ? season.pct : 0;
			finalPrice += avgPrice * (1 + pct / 100);
		}

		//Calculate HotDeals to deduct discount from prices
		avgPrice = Math.round(finalPrice/nights);
		finalPrice = 0;
		for (var d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
			var hotdeal = hotdealArray.find(item => {
				return new Date(item.start) <= d && new Date(item.end) >= d
			});
			var pct = hotdeal ? hotdeal.discount : 0;
			finalPrice += avgPrice - (avgPrice * (pct / 100));
		}

		//compensate for math.round difference
		finalPrice = Math.round(finalPrice)
		finalPriceNight = Math.round(finalPrice/nights);
		finalPrice = finalPriceNight * nights 


		// Put everything into the priceFindResult
		var priceFindResult = ({
		    priceTotal:         Number(finalPrice), 				 // The correct calculated total price from checkin to checkout 
			priceNight:         Number(finalPriceNight),			 // The price pr night is priceTotal divided by nights 
			nights:             Number(nights),      				 // The correct calculated amount of nights from checkin to checkout
			priceWeekend:       Number(priceArray.priceWeekend),	 // The standard price for friday night or saturday night
			priceWeek1:         Number(priceArray.priceWeek1),       // The standard price for weekday night (sun-mon-tue-wed-thu)
			priceWeek2:         Number(priceArray.priceWeek2),       // The standard price pr night (mon-sun) if more than 7 nights (more than 1 week)
			priceWeek3:         Number(priceArray.priceWeek3),       // The standard price pr night (mon-sun) if more than 14 nights (more than 2 weeks)
			priceMonth1:        Number(priceArray.priceMonth1),      // The standard price pr night (mon-sun) if more than 21 nights (more than 3 weeks)
			priceMonth2:        Number(priceArray.priceMonth2),      // The standard price pr night (mon-sun) if more than 30 nights (more than 1 month)
			priceMonth3:        Number(priceArray.priceMonth3),      // The standard price pr night (mon-sun) if more than 60 nights (more than 2 months)
			priceMonth6:        Number(priceArray.priceMonth6),      // The standard price pr night (mon-sun) if more than 180 nights (more than 6 months)
			priceYear:          Number(priceArray.priceYear),        // The standard price pr night (mon-sun) if more than 360 nights (1 year or more)
			commissionDay:      Number(priceArray.commissionDay),    // Agent commission in percentage for daily rental 1-6 nights
			commissionWeek:     Number(priceArray.commissionWeek),   // Agent commission in percentage for weekly rental 7-30 nights
			commissionMonth:    Number(priceArray.commissionMonth),  // Agent commission in percentage for monthly rental 31-180 nights
			commissionHalf:     Number(priceArray.priceMonth6*15),   // Agent commission in percentage for half year rental 181-359 nights (half a month rent)
			commissionYear:     Number(priceArray.priceYear*30),  	 // Agent commission in percentage for full year rental 360+ nights (a month rent)
			depositDay:         Number(priceArray.depositDay),       // Safety Deposit for daily rental 1-6 nights
			depositWeek:        Number(priceArray.depositWeek),      // Safety Deposit for weekly rental 7-30 nights
			depositMonth:       Number(priceArray.priceYear*30),   	 // Safety Deposit for monthly rental 31-359 nights (1 month rent)
			depositYear:        Number(priceArray.priceYear*60),   	 // Safety Deposit for year rental 360+ nights (2 months rent)  
			reservationWeek:    Number(priceArray.reservationWeek),  // Reservation fee for daily/weekly rental 1-30 nights (reservation is paid as part of total price)
			reservationMonth:   Number(priceArray.reservationMonth), // Reservation fee for monthly rental 31-179 nights (reservation is paid as part of total price)
			reservationYear:    Number(priceArray.priceYear*30)   	 // Reservation fee for year rental 180+ nights (reservation is paid as part of total price)
		});
		console.log ('finalPrice ' + finalPrice)
		console.log ('finalPriceNight ' + finalPriceNight)
		console.log ('nights ' + nights)

		res.json({error:false,priceFindResult})
        console.log("Sent data back to router");
	}


	//
	// Start all the promises
	//
	Promise.all([findPrice, findSeason, findHotdeal])
		.then(calculatePrice)
		.catch(err => {
			console.log("priceController ERROR: " + err);
			res.json({error:true,err})
		}
	)

}

// Calculate amount of DAYS between two dates
function daysBetween(date1, date2) {
    var ONE_DAY = 1000 * 60 * 60 * 24
    var date1_ms = date1.getTime()
    var date2_ms = date2.getTime()
    var difference_ms = Math.abs(date1_ms - date2_ms)
    return Math.round(difference_ms/ONE_DAY)
}

