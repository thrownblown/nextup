#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require('sanitizer');
var utils = require('./utils');


module.exports.bigRSS = function (){
  var archive = fs.readdirSync('./json/');
  var main = fs.readdirSync('./scrapeArchive/');
  request('https://news.ycombinator.com', function (error, response, html) {
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(html);
      $('span.comhead').each(function(i, element){
        var a = $(this).prev();
        var rank = a.parent().parent().text();
        var title = a.text();

        var url = a.attr('href');
        var subtext = a
          .parent()
          .parent()
          .next()
          .children('.subtext')
          .children();
        var points = $(subtext).eq(0).text();
        var username = $(subtext).eq(1).text();
        var comments = $(subtext).eq(2).text();
        var metadata = {
          rank: parseInt(rank),
          title: title,
          url: url,
          points: parseInt(points),
          username: username,
          comments: parseInt(comments),
          file: title
          .replace(/[^\w\s]|_/g, "")
          .replace(/\s+/g, "").replace(/ +?/g, '')
          .toLowerCase()
        };
        if (archive.indexOf(metadata.file + '.json') === -1 && main.indexOf(metadata.file + '.json') === -1){
          scrapeSite(metadata.url, metadata.title, metadata)
        }
      });
    }
  });
}

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
          if (err) throw err;
          console.log('It\'s saved! ', title);
        });
      }
    }
  });
  return metadata;
};