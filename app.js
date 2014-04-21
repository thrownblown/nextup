
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

var docFetch = require('./docFetch');
var cypherURL = process.env.CYPHER || "http://localhost:7474/db/data/cypher";
var batch = require('./batchOp');
var readURL = require('./scrape.js');

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
app.use(express.json());
app.use(express.urlencoded());


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
  // routes.index;
  docFetch.randNodeFetch(cypherURL, 25)
  .then(function(result) {
    return res.send(result);
  });
});

app.get('/users', user.list);

// app.get('/article/*', function(req, res) {
//   var fullUrl = req.url;

//   var articleUrl = fullUrl.slice(fullUrl.indexOf("http"));
//   var mongoURL = { url: articleUrl };
//   var response = [];

//   readURL.Site.find(mongoURL)
//   .exec(function(err, result) {
//     if (result.length === 0) {
//       console.log("Not in mongo");
//       readURL.readSiteByUrl(articleUrl)
//       .then(function(readJSON) {
//         response.push(readJSON);
//         return response;
//       })
//       .then(function() {
//         return docFetch.cosSimFetch(cypherURL, articleUrl, 0.0, 10);
//       })
//       .then(function(topCosSim) {
//         return response.push(topCosSim);
//       })
//       .then(function() {
//         return res.send(response);
//       });
//     } else {
//       console.log("Found in mongo");
//       response.push(result);
//       docFetch.cosSimFetch(cypherURL, articleUrl, 0.0, 10)
//       .then(function(topCosSim) {
//         response.push(topCosSim);
//         return res.send(response);
//         //res.render('index', )
//       });
//     }
//   });
// });
app.post('/article', function(req, res) {
  var request = { title: req.body.title, url: req.body.url };
  var mongoURL = { url: request.url };
  var articleUrl = request.url;
  var response = [];
  console.log(request);
  if (!batch.isInNeo4j(request, batch.masterDoclist)) {
    console.log("DOES THIS EVEN WORK?!?!");
    return res.send("Invalid Request");
  }
  readURL.Site.find(mongoURL)
  .exec(function(err, result) {
    if (result.length === 0) {
      console.log("Not in mongo");
      readURL.readSiteByUrl(articleUrl)
      .then(function(readJSON) {
        response.push(readJSON);
        return response;
      })
      .then(function() {
        return docFetch.cosSimFetch(cypherURL, articleUrl, 0.0, 25);
      })
      .then(function(topCosSim) {
        return response.push(topCosSim);
      })
      .then(function() {
        return res.send(response);
      });
    } else {
      console.log("Found in mongo");
      response.push(result);
      docFetch.cosSimFetch(cypherURL, articleUrl, 0.0, 25)
      .then(function(topCosSim) {
        response.push(topCosSim);
        return res.send(response);
      });
    }
  });
});

app.get('/all/neo4j', function(req, res) {
  docFetch.allDocFetch(cypherURL)
  .then(function(result) {
    return res.send(result);
  })
  .catch(function(error) {
    console.log("Errored out ", error);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// require serverInit.js
require('./serverInit.js');
