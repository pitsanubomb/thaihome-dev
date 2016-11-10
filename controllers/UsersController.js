var Users = require('../models/Users');

exports.getAdmins = function(req, res){
	Users.find({type:"admin"}, function(err, data){
		if(!err){
			res.json({error:false,data:data});
		}else{
			res.json({error:true,message:"ERROR ON SELECTING ADMINS"});
		}
	})
};
