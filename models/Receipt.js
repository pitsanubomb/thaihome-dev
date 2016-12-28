var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var receiptSchema = new Schema({
    _id: String,
    receiptNo : Number,
    invoiceId : String,
    bookingId : String,
    paidDate : String,
    dueDate : String,
    paidDate : String,
    amount : Number,
    account : Number,
    managerId : String
});

module.exports = mongoose.model('receipt', receiptSchema, 'receipt');