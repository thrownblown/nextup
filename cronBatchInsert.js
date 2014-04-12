/*

1. set up a cron job? Or time interval?
2. create function to read all file names (files?) in directory into array
    - ALL files in directory at once
3. batch insert array
    - currently this is recursive
    - assumes ALL batch insert requests are successful
    - does NOT catch unsuccessful batch requests
4. upon finishing batch insert, move json files to scrapeArchive
    - this holds json files that have already been inserted into neo4j

TL;DR

  1. read dir for file names (async)
  2. batch insert files (async)
  3. move files to archive when batch if batch is successful (assume yes)

*/

var Promise = require('bluebird');
var mv = require('mv');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));

// GLOBAL VARIABLES

// PATH
// assuming cronBatchInsert is on the same level as app.js for now
var _dirname = process.cwd();
var jsonDir = path.join(_dirname, 'json');
var scrapeArchive = path.join(_dirname, 'scrapeArchive');
var dummyJSON = path.join(_dirname, 'dummyJSON');

// uncomment one of the below to test 
var testDir = dummyJSON;
// var testDir = jsonDir;

// HELPER FUNCTIONS
var consoleStart = function (data, title) {
  var title = title || "";
  console.log("\n\n");
  console.log("********** BEGIN " + title + " **********" + "\n\n");
  console.log(data);
  console.log("\n\n********** END " + title + " **********");
  console.log("\n\n");
};

// SCRIPT FOR EXECUTION

// reads a directory and returns a list of files
var readJsonDir = function (fromSource) {
  return fs.readdirAsync(fromSource).map(function (filename, index) {
    var fileSource = path.join(fromSource, filename);
    return fs.readFileAsync(fileSource, "utf8").then(JSON.parse);
  });
};


var batchTest = function (fileList) {
  consoleStart(fileList, "file list from readddir");
};

// readJsonDir(testDir)
//   .then(batchTest)
//   .caught(consoleStart);

// moves specific files from one directory to another directory
var moveJson = function (filenameList, fromSource, toDest) {
  if (!filenameList || !fromSource || !toDest) { throw "filename or path not specified"; }
  consoleStart(filenameList, "list of filenames");
  consoleStart(fromSource, "fromSource name");
  consoleStart(toDest, "toDest name");

  for (var i = 0; i < filenameList.length; i++) {
    var fileSource = path.join(fromSource, filenameList[i]);
    var fileDest = path.join(toDest, filenameList[i]);
    mv(fileSource, fileDest, function (err){ 
      consoleStart(err, 'file move error')
    });
  }
};

// for testing
fs.readdir(testDir, function (err, filenames) {
  if (err) throw err;
  moveJson(filenames, dummyJSON, scrapeArchive);
});

// // move things back 
// moveJson(scrapeArchive, json);

