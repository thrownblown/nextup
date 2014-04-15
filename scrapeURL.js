#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require("sanitizer");

module.exports.scrapeURL = function(url){
  console.log('hello')
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
      //using the word as a hash its value is the number of occurrences of the key-word in each document
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

var replaceAllBackSlash = function (targetStr){
  var index=targetStr.indexOf("\\");
  while(index >= 0){
      targetStr=targetStr.replace("\\","");
      index=targetStr.indexOf("\\");
  }
  return targetStr;
};