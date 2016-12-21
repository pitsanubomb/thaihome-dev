var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var beds24DataSchema = new Schema({
    date: { type: Date, default: Date.now },
    data: {},
    th_id: String
});
module.exports = mongoose.model('beds24Data', beds24DataSchema, 'beds24Data');