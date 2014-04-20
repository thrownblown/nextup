#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var utils = require('./utils');
var FeedParser = require('feedparser');

module.exports.bigRSS = function (rss){
  var archive = fs.readdirSync('./scrapeArchive/');
  var main = fs.readdirSync('./json/');
  var rssFeed = rss || 'https://news.ycombinator.com/bigrss'; 
  var req = request(rssFeed)
  var feedparser = new FeedParser();
  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    stream.pipe(feedparser);
  });

  feedparser.on('readable', function() {
    var stream = this
    var meta = this.meta
    var item;

    while (item = stream.read()) {
      item.file = item.title
        .replace(/[^\w\s]|_/g, '')
        .replace(/\W+/g, '')
        .replace(/\s+/g, '')
        .replace(/ +?/g, '')
        .replace()
        .toLowerCase();
        //if then for directory
        //if (archive.indexOf(item.file + '.json') === -1 && main.indexOf(item.file + '.json') === -1){
          scrapeSite(item.link, item.title, item);
        //}
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
      //bodyText = utils.replaceAllBackSlash(bodyText);
      obj = utils.makeJSON(bodyText);
      //should use obj extend....
      metadata.wordunique = obj.wordunique;
      metadata.wordcount = obj.wordcount;
      metadata.wordtable = obj.wordtable;

      if (metadata.wordcount > 20 || metadata.wordtable !== {"":0}){
        fs.writeFile('./json/' + metadata.file + '.json', JSON.stringify(metadata), function (err) {
          //if (err) throw err;
          //console.log('It\'s saved! ', title);
        });
      }
    }
  });
  return metadata;
};


