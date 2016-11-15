var CheckList = require('../models/CheckList');

exports.getCheckListByProperty = function(req, res){
	CheckList.find({property:req.params.property}, function(err, list){
		if(!err){
			res.json({error:false,data:list});
		}else{
			res.json({error:true,message:"Error on selecting checklist for property.!"});
		}
	});
};