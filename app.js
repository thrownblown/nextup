
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

// require neo4j
var neo4j = require("node-neo4j");
var neo4jURL = "http://127.0.0.1:7474";
db = new neo4j(neo4jURL);

var app = express();


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/article/:url', function(req, res) {
  var url = req.params.article;
  var response = [];
  // checks if url is in mongo
  mongoCheck(url, function(yes) {
    if(yes) {
      // if its in mongo, query mongo for doc and send doc as well as send 5 similar documents
      mongoQuery(url, function(readability) {
        response.push(readability);
        cosSimFetch(cypherURL, url, 0.0, 5, function() {
          res.send(response);
        });
        res.send(response);
      });
    } else {
      // if not in mongo, query readability
      readabilityQuery(article, function(response) {
        // save the readability response to mongo and send the response
        saveToMongo(response, function(err, response) {
          if (err) {
            console.log(err);
          }
          res.send(response);
        });
      });
    }
  });
});

app.get('/article/:url', function(req, res) {
  var url = req.params.article;
  var mongoURL = { url: req.params.article };
  var response = [];

  mongoQuery({ url: req.params.article })
  .exec(function(err, result) {
    if (err) {
      // need to promisify readSiteByUrl
      readSiteByUrl(url)
      .then(function(readJSON) {
        response.push(readJSON);
        return response;
      })
      .then(function() {
        return cosSimFetch(cypherURL, url, 0.0, 10);
      })
      .then(function(topCosSim) {
        return response.push(topCosSim);
      })
      .then(function() {
        return res.send(response);
      });
    } else {
      response.push(result);
      cosSimFetch(cypherURL, url, 0.0, 10)
      .then(function(topCosSim) {
        response.push(topCosSim);
        return res.send(response);
      });
    }
  });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Require BatchOP
require("./batchOp.js");

// require serverInit.js
require('./serverInit.js');

// require cronBatchInsert.js to test
// require("./cronBatchInsert.js");
