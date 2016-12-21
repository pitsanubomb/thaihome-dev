var Invoice = require('../models/invoice');

exports.getInvoicesBayDateRange = function(req, res){
    Invoice.find({
    $where: function () {
        var date = new Date(this.dueDate);
        return (date <= new Date((Math.round(new Date() / 1000) + 604800 )  * 1000)) && this.paidDate == ''
    }
    }, function(err, invoices){
        if(!err){
            res.json({error:false, data:invoices});
        }else{
            res.json({error:true, message:err});
        }
    })
}