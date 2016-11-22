var express = require('express');
var request = require('request');
var mongoose = require('mongoose');

var app = express();
var PORT = process.env.PORT || 3000;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://admin:admin@ds159497.mlab.com:59497/shorturl');

var History = require('./models/history');

app.use(express.static(__dirname+'/public'));

app.get('/imagesearch/:mysearch', function (req, res) {
    var search = encodeURIComponent(req.params.mysearch);
    var page = req.query.offset || 1;
    
    request({
        url: `https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=${search}&offset=${page}`,
        headers: {
            "Ocp-Apim-Subscription-Key": 'c666586a2b23423292c880e70d30eba0'
        },
        json: true,
    }, function (error, response, body) {
        if (error) {
            res.status(404).json("Error");
        } else {
            var filteredBody = body.value.map(function (image) {
                return {
                    name: image.name,
                    thumbnail: image.thumbnailUrl,
                    url: image.contentUrl,
                    host: image.hostPageUrl
                }
            });
            new History({ term: search }).save();
            res.json(filteredBody);
        }
    });
});

app.get('/latest', function(req, res){
    History.find({}).limit(10).sort({when:-1}).select({term:1,when:1,"_id": 0}).exec(function(err, posts){
        if(err) return res.status(500).json("Couldn't connect to DB");
        res.json(posts);
    });
});

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!');
});