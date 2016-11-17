var CheckList = require('../models/CheckList');

exports.getCheckListByProperty = function(req, res){
	if(typeof req.params.property != 'undefined'){
		CheckList.find({property:req.params.property}, function(err, list){
			if(!err){
				res.json({error:false,data:list});
			}else{
				res.json({error:true,message:"Error on selecting checklist for property.!"});
			}
		});
	}else{
		res.json({error:true, message:"Bad credientals on request data."});
	}

};

exports.copyChecklistForProperty = function(req, res){
	function stringGen(len) {
	    var text = " ";
	    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	    for(var i = 0; i < len; i++)
	        text += charset.charAt(Math.floor(Math.random() * charset.length));
	    return text;
	}
	if(typeof req.body.from != 'undefined' && typeof req.body.to != 'undefined'){
		CheckList.find({property:req.body.from}, function(err, list){
			if(!err){
				console.log(list);
				var collected = [];
				for(var i = 0; i < list.length; i++){
					collected.push({
						_id:stringGen(5),
						property:req.body.to,
						category: list[i].category,
						item:list[i].item
					});
				}

				function insertUpdatedDocs(index){
					var current = new CheckList(collected[index]);
					current.save(function(err, data){
						if(err){
							console.log(err);
						}
						if(index + 1 < collected.length){
							index++;
							insertUpdatedDocs(index);
						}
					})
				}
				insertUpdatedDocs(0);
				res.json({error:false});
			}else{
				res.json({error:true,message:"Error on selecting checklist for property.!"});
			}
		});
	}else{
		res.json({error:true, message:"Bad credientals on request data."});
	}
};
