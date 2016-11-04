
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var usersSchema = new Schema({
  id: String,
  username: String,
  email: String,
  password: String,
  name: String,
  agent:Date,
  phone: String,
  country: String,
  agency: String,
  token: String,
  comment: String,
  languages : [],
  type: String,
  created: String,
  lastContact:String,
  auth:String,
  singnature:String,
  lastMessengerMail:Number
});

module.exports = mongoose.model('users', usersSchema);
