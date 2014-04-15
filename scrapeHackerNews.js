#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require('sanitizer');

//
module.exports.bigRSS = function (){
  request('https://news.ycombinator.com/bigrss', function (error, response, html) {
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(html);
      $('item').each(function(i, element){
        console.log(i, element.children.data)
        var url, title;
        if (element.next.data){
          url = element.next.data;
          title = i;
        }
        // url = url.replace(/(&#x2F;)/g, '/');
        var metadata = {
          title: title,
          url: url,
        };
        scrapeSite(url, title, metadata);
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
      bodyText = stripHTML(bodyText);
      obj = makeJSON(bodyText);
      //should use obj extend....
      metadata.wordunique = obj.wordunique;
      metadata.wordcount = obj.wordcount;
      metadata.wordtable = obj.wordtable;
      if (metadata.wordcount > 20 || metadata.wordtable !== {"":0}){
        fs.writeFile('./json/' + metadata.title + '.json', JSON.stringify(metadata), function (err) {
          if (err) throw err;
          console.log('It\'s saved! ', title);
        });
      }
    }
  });
  return metadata;
};

module.exports.scrapeURL = function(url){
  // takes a url as an input, it scrapes the url and makes a json object ready to be saved into our json folder
  var jsonBack;
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = stripHTML(bodyText);
      jsonBack = makeJSON(bodyText);
    }
  });
  return jsonBack;
};

var makeJSON = function(str){
  var returnObj = {
    wordtable: {},
    wordcount: 0,
    wordunique: 0
  };
   //split all the words into an array so we can count and consolidate them
  var words = str.split(' ');
  returnObj.wordcount = 0;
  for (var i = 0; i < words.length; i++){
    if (words[i].length<20&&!parseInt(words[i])){
      words[i] = words[i].toLowerCase();
      //using the word as a hash-key, its value is the number of occurrences of the key-word in each document
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
return returnObj;
}

var stripHTML = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean.replace(/<(?:.|\n)*?>/gm, "");
  clean = clean.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "\n");
  clean = clean.replace(/(\r\n|\n|\r|\t)/gm,"");
  clean = clean.replace(/[^\w\s]|_/g, "")
  clean = clean.replace(/\s+/g, " ");
  return clean.trim();
};
