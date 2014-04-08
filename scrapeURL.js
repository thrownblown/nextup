#!/usr/bin/env node

var sanitizer = require("sanitizer");
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

// https://news.ycombinator.com/

request('https://news.ycombinator.com', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    $('span.comhead').each(function(i, element){
      var a = $(this).prev();
      var rank = a.parent().parent().text();
      var title = a.text();
      var url = a.attr('href');
      var subtext = a.parent().parent().next().children('.subtext').children();
      var points = $(subtext).eq(0).text();
      var username = $(subtext).eq(1).text();
      var comments = $(subtext).eq(2).text();
      // Our parsed meta data object
      var metadata = {
        rank: parseInt(rank),
        title: title,
        url: url,
        points: parseInt(points),
        username: username,
        comments: parseInt(comments)
      };
      console.log(metadata);
      scrapeSite(url, title);
      // scraper(url, function (data) {
      //   console.log("# %s #\n\n%s\n\n---", data.title, data.contents);
      //   getWords(data);
      // }); 
      
    });
  }
});

var scrapeSite = function(url, title, error, response, html){
  var phraseMem = {};
  var wordAbeMem = {};
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bigBlock = $('body *').text();
      bigBlock = stripHTML(bigBlock);
      bigBlock = bigBlock.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
      bigBlock = bigBlock.replace(/(\r\n|\n|\r|\t)/gm,"");

      var words = bigBlock.split(' ');
      for (var i = 0; i < words.length; i++){
        if (words[i].length<20){
          words[i] = words[i].toLowerCase();
          if (words[i] in wordAbeMem){
            wordAbeMem[words[i]]++;
          } else {
            wordAbeMem[words[i]] = 0;
          }
        }
      }
      fs.writeFile(title+'Words.json', JSON.stringify(wordAbeMem), function (err) {
        if (err) throw err;
        console.log('It\'s saved! ', title+'Words.json');
      });    
    }
  });
}

function stripHTML(html) {
    var clean = sanitizer.sanitize(html, function (str) {
        return str;
    });
    clean = clean.replace(/<(?:.|\n)*?>/gm, "");
    clean = clean.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "\n");
    return clean.trim();
}

function replaceAllBackSlash(targetStr){
  var index=targetStr.indexOf("\\");
  while(index >= 0){
      targetStr=targetStr.replace("\\","");
      index=targetStr.indexOf("\\");
  }
  return targetStr;
}
