/**
 * Created by armsofter on 3/19/17.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var newsSchema = new Schema({
    _id: String,
    start: Number,
    end: Number,
    text: String
});

module.exports = mongoose.model('news', newsSchema, 'news');
