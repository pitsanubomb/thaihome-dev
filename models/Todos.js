var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var todoSchema = new Schema({
  _id: String,
  category: String,
  manager: String,
  dueDate: String,
  time: String,
  taskText:Date,
  propertyId: String,
  bookingId: String,
  done: Boolean,
  createDate: String
});

module.exports = mongoose.model('todo', todoSchema, 'todo');
