// #!/usr/bin/env node
// var request = require('request');
// var cheerio = require('cheerio');
// var sanitizer = require('sanitizer');
// var mongoose = require('mongoose');
// var Promise = require('bluebird');
// // var fs = require('fs');

// // var Schema = mongoose.Schema;
// // var db = mongoose.connection;
// // mongoose.connect('mongodb://localhost/db');

// // schema is too big but thats everything we get from readability api

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
// module.exports.Site = Site;
// // var mem = {
// //   docs: {}
// // };
// // var count = 0;

// var apiKey = process.env.API || '9695482fe1197a0ba40b18c71190d2669b7d903a';

// exports.readSiteByUrl = function(url){
//   return new Promise (function(resolve, reject) {
//     var requrl = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
//     console.log(requrl);
//     request(requrl, function (error, response, html) {
//       if (!error && response.statusCode === 200) {
//         var readJSON = JSON.parse(html);
//         var site = new Site(readJSON);
//         site.save(function(err, result){
//           if (err) {
//             reject(err);
//           }
//           console.log('saved to db ' + readJSON);
//           resolve(readJSON);
//         });
//       }
//     });
//   });
// };
//       // mem.docs[count++] = {
//       //   title: readJSON.title,
//       //   content: readJSON.content,
//       //   //random set of related docs, to be replaced by n3o4j suggestions
//       //   related: range(Math.floor(Math.random() * count))
//       // };
//       // fs.writeFile('./json/' + readJSON.file + '.json', JSON.stringify(readJSON), function (err) {
//       //   if (err) throw err;
//       //   console.log('It\'s saved! ', readJSON.file);
//       // });
//       // dummy data structure
//       // { docs: {
//       //   1: {
//       //     title: '',
//       //     content: '',
//       //     related: [2,3,4]
//       //     }
//       //   }
//       // }
//       // this file write below needs to get promised so that it only happens 
//       // once after all the docs have come back
//       // fs.writeFile('./json/mem.json', JSON.stringify(mem), function (err) {
//       //   if (err) throw err;
//       //   console.log('mem\'s saved! ');
//       // });
