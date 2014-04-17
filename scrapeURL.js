#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sanitizer = require("sanitizer");
var utils = require('./utils');

module.exports.scrapeURL = function(url){
  // takes a url as an input, it scrapes the url and makes a json object ready to be saved into our json folder
  var jsonBack;
  request(url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var bodyText = $('body *').text();
      bodyText = utils.stripHTML(bodyText);
      jsonBack = utils.makeJSON(bodyText);
    }
  });
  return jsonBack;
};