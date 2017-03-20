/**
 * Created by armsofter on 3/19/17.
 */

var express = require('express');
var router = express.Router();
var NewsController = require('../controllers/NewsController');

/* GET users listing. */
router.get('/getNewsForHomePage', function(req, res, next) {
    NewsController.getNewsForHomePage(req, res);
});

module.exports = router;
