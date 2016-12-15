var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var currencyDataSchema = new Schema({
    date: Number,
    data:String
});

module.exports = mongoose.model('currencydata', currencyDataSchema, 'currencydata');