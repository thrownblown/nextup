#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require("sanitizer");
// var Promise = require('promise');
// var Q = require('q');


// https://news.ycombinator.com/

request('https://news.ycombinator.com', function (error, response, html) {
  if (!error && response.statusCode === 200) {
    var $ = cheerio.load(html);
    $('span.comhead').each(function(i, element){
      metadata = {};
      var a = $(this).prev();
      var rank = a.parent().parent().text();
      var title = a.text();

      var url = a.attr('href');
      var subtext = a.parent().parent().next().children('.subtext').children();
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
        fileName: title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, "").replace(/ +?/g, '').toLowerCase()
      };
      scrapeSite(url, title, metadata);
    });
  }
});



var scrapeSite = function(url, title, metadata, error, response, html){
  var obj = {
    wordtable: {},
    wordcount: 0,
    wordunique: 0
  };
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = stripHTML(bodyText);
      bodyText = bodyText.replace(/(\r\n|\n|\r|\t)/gm,"");
      bodyText = bodyText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
      var words = bodyText.split(' ');
      obj.wordcount = 0;
      for (var i = 0; i < words.length; i++){
        if (words[i].length<20&&!parseInt(words[i])){
          words[i] = words[i].toLowerCase();
          if (words[i] in obj.wordtable){
            obj.wordcount++;
            obj.wordtable[words[i]]++;
          } else {
            obj.wordcount++;
            obj.wordtable[words[i]] = 0;
          }
        }
      }
      for(var e in obj.wordtable) {
        if(obj.wordtable.hasOwnProperty(e)){
          obj.wordunique++;
        }
      }
      metadata.wordunique = obj.wordunique;
      metadata.wordcount = obj.wordcount;
      metadata.wordtable = obj.wordtable;
      fs.writeFile('./json/' + metadata.fileName + '.json', JSON.stringify(metadata), function (err) {
        if (err) throw err;
        console.log('It\'s saved! ', title);
      });
    }
  });
  return metadata;
};

module.exports = function(url){
  var returnObj = {
    wordtable: {},
    wordcount: 0,
    wordunique: 0
  };
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = stripHTML(bodyText);
      bodyText = bodyText.replace(/(\r\n|\n|\r|\t)/gm,"");
      bodyText = bodyText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
      var words = bodyText.split(' ');
      returnObj.wordcount = 0;
      for (var i = 0; i < words.length; i++){
        if (words[i].length<20&&!parseInt(words[i])){
          words[i] = words[i].toLowerCase();
          if (words[i] in returnObj.wordtable){
            returnObj.wordcount++;
            returnObj.wordtable[words[i]]++;
          } else {
            returnObj.wordcount++;
            returnObj.wordtable[words[i]] = 0;
          }
        }
      }
      for(var e in returnObj.wordtable) {
        if(returnObj.wordtable.hasOwnProperty(e)){
          returnObj.wordunique++;
        }
      }
    }
    return returnObj;
  });
};

var stripHTML = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean.replace(/<(?:.|\n)*?>/gm, "");
  clean = clean.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "\n");
  return clean.trim();
};

var replaceAllBackSlash = function (targetStr){
  var index=targetStr.indexOf("\\");
  while(index >= 0){
      targetStr=targetStr.replace("\\","");
      index=targetStr.indexOf("\\");
  }
  return targetStr;
};
