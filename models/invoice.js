var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var invoiceSchema = new Schema({
    _id: String,
    invoiceNumber : Number,
    bookingId : String,
    propertyId : String,
    createDate : String,
    dueDate : String,
    paidDate : String,
    paymentSuggest : Number,
    managerId : String,
    invoiceLines : [],
    includeMissing : Boolean
});

module.exports = mongoose.model('invoice', invoiceSchema, 'invoice');