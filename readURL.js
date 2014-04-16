#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var range = require('node-range');
// var mongoose = require('mongoose');

// var Schema = mongoose.Schema;
// var db = mongoose.connection;
// mongoose.connect('mongodb://localhost/db');

// schema is too big but thats everything we get from readability api

// var siteSchema = new Schema({
//   content: String,
//   domain: String,
//   author: String,
//   url: String,
//   short_url: String,
//   title: String,
//   excerpt: String,
//   direction: String,
//   word_count: Number,
//   total_pages: Number,
//   date_published: Date,
//   dek: String,
//   lead_image_url: String,
//   next_page_id: Number,
//   rendered_pages: Number,
//   file: String
// });

// var Site = mongoose.model('Site', siteSchema);

var mem = {
  docs: {}
};
var count = 0;

var apiKey = process.env.API || '9695482fe1197a0ba40b18c71190d2669b7d903a';

module.exports.readSiteByUrl = readSiteByUrl = function(url, apiKey){
  var requrl =
    'https://readability.com/api/content/v1/parser?url='
    + url + '&token=' + apiKey;
  request(requrl, function (error, response, html) {
    if (!error && response.statusCode === 200) {
      var readJSON = JSON.parse(html);
      readJSON.file = readJSON.title
        .replace(/[^\w\s]|_/g, '')
        .replace(/\s+/g, '')
        .replace(/ +?/g, '')
        .toLowerCase();
      // var site = new Site(readJSON);
      // site.save(function(err){
      //   if (err) throw err;
      //   console.log('saved to db ' + readJSON.file);
      // });
      mem.docs[count++] = {
        title: readJSON.title,
        content: readJSON.content,
        //random set of related docs, to be replaced by n3o4j suggestions
        related: range(Math.floor(Math.random() * count))
      };
      fs.writeFile('./json/' + readJSON.file + '.json', JSON.stringify(readJSON), function (err) {
        if (err) throw err;
        console.log('It\'s saved! ', readJSON.file);
      });
      // dummy data structure
      // { docs: {
      //   1: {
      //     title: '',
      //     content: '',
      //     related: [2,3,4]
      //     }
      //   }
      // }
      // this file write below needs to get promised so that it only happens 
      // once after all the docs have come back
      fs.writeFile('./json/mem.json', JSON.stringify(mem), function (err) {
        if (err) throw err;
        console.log('mem\'s saved! ');
      });
    }
  });
};

//this is here to make dummy data, ultimately i wish to just save the entries to mongo
request('https://news.ycombinator.com', function (error, response, html) {
  if (!error && response.statusCode === 200) {
    var $ = cheerio.load(html);
    $('span.comhead').each(function(i, element){
      var a = $(this).prev();to
      var url = a.attr('href');
      readSiteByUrl(url, apiKey);
    });
  }
});
