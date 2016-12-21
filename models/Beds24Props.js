var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var beds24PropsSchema = new Schema({
    key: String,
    rooms: [],
    roomId:String
});
module.exports = mongoose.model('beds24Props', beds24PropsSchema, 'beds24Props');