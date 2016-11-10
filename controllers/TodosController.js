var Todo = require('../models/Todos');

exports.getTodos = function(req, res){
	Todo.find({done:false}, function(err, data){
		if(!err){
			res.json({error:false,data:data});
		}else{
			res.json({error:true,message:"ERROR ON SELECTING TODOS"});
		}
	})
};
