#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require('sanitizer');
// var read = require('node-readability');
var mongoose = require('mongoose');
var Promise = require('bluebird');

var Schema = mongoose.Schema;
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/db');

var siteSchema = new Schema({
  content: String,
  domain: String,
  author: String,
  url: String,
  short_url: String,
  title: String,
  excerpt: String,
  direction: String,
  word_count: Number,
  total_pages: Number,
  date_published: Date,
  dek: String,
  lead_image_url: String,
  next_page_id: Number,
  rendered_pages: Number,
  file: String
});

var Site = mongoose.model('Site', siteSchema);
module.exports.Site = Site;


var apiKey = '9695482fe1197a0ba40b18c71190d2669b7d903a';

exports.readSiteByUrl = function(url){
  return new Promise (function(resolve, reject) {
    var requrl = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
    console.log(requrl);
    request(requrl, function (error, response, html) {
      if (!error && response.statusCode === 200) {
        var readJSON = JSON.parse(html);
        var site = new Site(readJSON);
        site.save(function(err, result){
          if (err) {
            reject(err);
          }
          console.log('saved to db ' + readJSON);
          resolve(readJSON);
        });
      }
    });
  });
};

// request('https://news.ycombinator.com', function (error, response, html) {
//   if (!error && response.statusCode === 200) {
//     var $ = cheerio.load(html);
//     $('span.comhead').each(function(i, element){
//       var a = $(this).prev();
//       var url = a.attr('href');
//       readSiteByUrl(url);
//     });
//   }
// });

var stripHTML = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean
    .replace(/<(?:.|\n)*?>/gm, '')
    .replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "\n");
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
