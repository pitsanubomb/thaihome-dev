var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var emailVariableSchema = new Schema({
  variable: String,
  func: String,
  condition: String
});

module.exports = mongoose.model('emailVariable', emailVariableSchema, 'emailVariable');