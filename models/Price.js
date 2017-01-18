/**
 * Created by armsofter on 1/14/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var priceSchema = new Schema({
    _id: String,
    name: String,
    season: String,
    property: String,
    priceDay: Number,
    priceWeekend: Number,
    priceWeek: Number,
    priceMonth: Number,
    priceYear: Number,
    commissionDay: Number,
    commissionWeek: Number,
    commissionMonth: Number,
    commissionYear: Number,
    created: Number,
    depositDay: Number,
    depositWeek: Number,
    depositMonth: Number,
    depositYear: Number,
    reservationDay: Number,
    reservationWeek: Number,
    reservationMonth: Number,
    reservationYear: Number
});
module.exports = mongoose.model('price', priceSchema, 'price');

