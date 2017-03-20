/**
 * Created by armsofter on 3/19/17.
 */

var News = require('../models/News');
var moment = require('moment');

exports.getNewsForHomePage = function(req, res){
    var Today = moment().utc().unix();
    News.find({ $and:[{start:{$lte:Today}},{end:{$gte:Today}}]}, function(err, data){
        if(!err){
            res.json({error:false, news:data});
        }else{
            res.json({error:true, message:"Error on selecting news"});
        }
    });
};
