#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require("sanitizer");

var superSet = [];

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
      // console.log(metadata);
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
  var wordMem = {};
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = stripHTML(bodyText);
      bodyText = bodyText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
      bodyText = bodyText.replace(/(\r\n|\n|\r|\t)/gm,"");

      var words = bodyText.split(' ');
      for (var i = 0; i < words.length; i++){
        if (words[i].length<20){
          words[i] = words[i].toLowerCase();
          // superSet.push(words[i]);
          if (words[i] in wordMem){
            wordMem[words[i]]++;
          } else {
            wordMem[words[i]] = 0;
          }
        }
      }
      fs.writeFile('./json/' + title+'Words.json', JSON.stringify(wordMem), function (err) {
        if (err) throw err;
        console.log('It\'s saved! ', title+'Words.json');
        superSet = superSet.concat(words);
          var wordMem = {};
          console.log('YO!!!!',superSet);
          for (var i = 0; i < superSet.length; i++){
            if (superSet[i].length<20){

              if (superSet[i] in wordMem){
                wordMem[superSet[i]]++;
              } else {
                wordMem[superSet[i]] = 0;
              }
              
            }
          }
          fs.writeFile('Words.json', JSON.stringify(wordMem), function (err) {
            if (err) throw err;
            console.log('It\'s saved! ','Words.json');
          }); 
        // console.log(superSet);
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