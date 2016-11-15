var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var checkListSchema = new Schema({
  _id: String,
  property: String,
  category: String,
  item: String,
});

module.exports = mongoose.model('checklist', checkListSchema, 'checklist');
