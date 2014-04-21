var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');


var saveAsJson = function (item, dir) {
  var dir = dir || './json/'
  item.file = toFilename(item);
  // item.file = item.title
  //         .replace(/[^\w\s]|_/g, '')
  //         .replace(/\W+/g, '')
  //         .replace(/\s+/g, '')
  //         .replace(/ +?/g, '')
  //         .replace()
  //         .toLowerCase();
          //if then for directory
  // if (archive.indexOf(item.file + '.json') === -1 && main.indexOf(item.file + '.json') === -1){
  //   scrapeSite(item.link, item.title, item);
  // }

  return fs.writeFileAsync(path.join(dir, item.file + '.json'), JSON.stringify(item));
};

var toFilename = function (item) {
  return item.title
          .replace(/[^\w\s]|_/g, '')
          .replace(/\W+/g, '')
          .replace(/\s+/g, '')
          .replace(/ +?/g, '')
          .replace()
          .toLowerCase();
};

/***
 *      ______                            _   
 *     |  ____|                          | |  
 *     | |__   __  __ _ __    ___   _ __ | |_ 
 *     |  __|  \ \/ /| '_ \  / _ \ | '__|| __|
 *     | |____  >  < | |_) || (_) || |   | |_ 
 *     |______|/_/\_\| .__/  \___/ |_|    \__|
 *                   | |                      
 *                   |_|                      
 */

module.exports.saveAsJson = saveAsJson;
module.exports.toFilename = toFilename;


/***
 *      _______          _        
 *     |__   __|        | |       
 *        | |  ___  ___ | |_  ___ 
 *        | | / _ \/ __|| __|/ __|
 *        | ||  __/\__ \| |_ \__ \
 *        |_| \___||___/ \__||___/
 *                                
 *                                
 */

var executeTest = function () {
  t1 = {title: "hello", link: 'www.greg.com', wordunique: 3, wordtable: {'i' : 1, 'like': 1, 'dogs': 1}};
  t2 = {title: "hello something esle's aosk agood HPAPY!", link: 'www.asldb.com', wordunique: 3, wordtable: {'i' : 1, 'like': 1, 'dogs': 1}};

  saveAsJson(t1);
  saveAsJson(t2);
};

// executeTest();
