#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
// var sanitizer = require('sanitizer');
var utils = require('./utils')
var FeedParser = require('feedparser')

  // if url not in list
//
// module.exports.bigRSS = function (){
//   request('https://news.ycombinator.com/bigrss', function (error, response, html) {
//     if (!error && response.statusCode === 200) {
//       var $ = cheerio.load(html);
//       $('item').each(function(i, element){
//         console.log(i, element.children.data)
//         var url, title;
//         if (element.next.data){
//           url = element.next.data;
//           title = i;
//         }
//         // url = url.replace(/(&#x2F;)/g, '/');
//         var metadata = {
//           title: title,
//           url: url,
//         };
//         scrapeSite(url, title, metadata);
//       });
//     }
//   });
// }
module.exports.bigRSS = function (){
  var FeedParser = require('feedparser')
    , request = require('request');

  var req = request('https://news.ycombinator.com/bigrss')
    , feedparser = new FeedParser();

  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    // always handle errors
  });
  feedparser.on('readable', function() {
    // This is where the action is!
    var stream = this
      , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
      , item;

    while (item = stream.read()) {
      item.file = item.title
        .replace(/[^\w\s]|_/g, '')
        .replace(/\s+/g, '')
        .replace(/ +?/g, '')
        .toLowerCase();
        scrapeSite(item.link, item.title, item);
      }
  });
};
var scrapeSite = function(url, title, metadata, error, response, html){

  var obj;
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = utils.stripHTML(bodyText);
      bodyText = utils.replaceAllBackSlash(bodyText);
      obj = utils.makeJSON(bodyText);
      //should use obj extend....
      metadata.wordunique = obj.wordunique;
      metadata.wordcount = obj.wordcount;
      metadata.wordtable = obj.wordtable;

      if (metadata.wordcount > 20 || metadata.wordtable !== {"":0}){
        fs.writeFile('./json/' + metadata.file + '.json', JSON.stringify(metadata), function (err) {
          if (err) throw err;
          console.log('It\'s saved! ', title);
        });
      }
    }
  });
  return metadata;
};
