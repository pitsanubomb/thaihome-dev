var Invoice = require('../models/Invoice');

exports.getInvoicesBayDateRange = function(req, res){
    Invoice.find({
    $where: function () {
        var date = new Date(this.dueDate);
        return (date >= new Date((Math.round(new Date() / 1000) - 604800 )  * 1000) && date <= new Date())
    }
    }, function(err, invoices){
        if(!err){
            res.json({error:false, data:invoices});
        }else{
            res.json({error:true, message:err});
        }
    })
}