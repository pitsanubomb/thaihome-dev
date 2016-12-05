var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var currencySchema = new Schema({
    _id: String,
    name: String,
    currency: String,
    symbol: String, 
    active: Boolean,
    default: Boolean
});

module.exports = mongoose.model('currency', currencySchema, 'currency');