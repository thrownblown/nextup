/*
// **
//  *      _____  _             
//  *     |  __ \| |            
//  *     | |__) | | __ _ _ __  
//  *     |  ___/| |/ _` | '_ \ 
//  *     | |    | | (_| | | | |
//  *     |_|    |_|\__,_|_| |_|
//  *                           
//  *                           
 
TL;DR
-----------------------
  0. ALL functions to be executed (except global/dependencies) are at the bottom of this page

  1. read './json' directory and create an array of those files (async)
  2. batch insert into Neo4j the array (async)
  3. move inserted files to archive when batchInsert is done (assumes batchInsert is ALWAYS successful, no error catching)


Explanation and TODO's
-----------------------
  1. set up a cron job? Or time interval?
  2. create function to read all file names (files?) in directory into array
      - ALL files in directory at once
  3. batch insert array
      - currently this is recursive
      - assumes ALL batch insert requests are successful
      - does NOT catch unsuccessful batch requests
  4. upon finishing batch insert, move json files to scrapeArchive
      - this holds json files that have already been inserted into neo4j


ASCII comment art
----------------------
  url: http://patorjk.com/software/taag/#p=display&f=Graffiti&t=Type%20Something%20
  type: Big

*/


// dependencies
var Promise = require('bluebird');
var mv      = require('mv');
var path    = require('path');
var CronJob = require('cron');
var batch   = require('./batchOp.js');
var rest    = require("restler");
var fs      = Promise.promisifyAll(require('fs'));
var consoleStart = require("./helpers/commonlyUsed.js").consoleStart;

// global variables
var cypherURL   = "http://localhost:7474/db/data/cypher";
var filesToMove = [];

// PATHS
// assuming cronBatchInsert is on the same level as app.js for now
var _dirname      = process.cwd();
var jsonDir       = path.join(_dirname, 'json');
var scrapeArchive = path.join(_dirname, 'scrapeArchive');
var dummyJSON     = path.join(_dirname, 'dummyJSON');

// uncomment one of the below to test 
var testDir = dummyJSON;
// var testDir = jsonDir;


/***
 *       _____                        _       _     
 *      / ____|                      | |     | |    
 *     | |     _ __ ___  _ __        | | ___ | |__  
 *     | |    | '__/ _ \| '_ \   _   | |/ _ \| '_ \ 
 *     | |____| | | (_) | | | | | |__| | (_) | |_) |
 *      \_____|_|  \___/|_| |_|  \____/ \___/|_.__/ 
 *                                                  
 *                                                  
 */

// this cron job checks the json folder to see if there are newly added files to be inserted into the neo4j DB.
// jsonfiles that have been inserted into the database are archived
var startCron = function (time) {
  time = time || "*/5 * * * * *";
  return new CronJob.CronJob(time, function () {
    console.log( "every 5 seconds execute checkDir");
    checkDir();
  }, null, true, "America/Los_Angeles");
};

// checks the JSON directory by default for any files, inserts them using batchOperations, then moves those JSON files to the archive
var checkDir = function (dir) {
  dir = dir || testDir
  readJsonDir(dir)
    .then(function (fileList) {
      consoleStart(fileList, "checkDir list of files to pass to insertDocs");
      batch.insertDocs(fileList, function () {
        moveJson(testDir, scrapeArchive, filesToMove);
      });
    })
    .caught(consoleStart);
};

/***
 *      _    _          _                       
 *     | |  | |        | |                      
 *     | |__| |   ___  | |  _ __     ___   _ __ 
 *     |  __  |  / _ \ | | | '_ \   / _ \ | '__|
 *     | |  | | |  __/ | | | |_) | |  __/ | |   
 *     |_|  |_|  \___| |_| | .__/   \___| |_|   
 *                         | |                  
 *                         |_|                  
 */

// reads a directory and returns an array of parsed JSON objects
var readJsonDir = function (fromSource) {
  consoleStart(fromSource, "read json dir");
  return fs.readdirAsync(fromSource).map(function (filename, index) {
    console.log("map filename: ", filename);

    // if statment is to ignore hidden files
    if (filename[0] !== '.') {
      var fileSource = path.join(fromSource, filename);
      filesToMove.push(filename);
      return fs.readFileAsync(fileSource, "utf8").then(JSON.parse);
    }
  });
};

// moves specific files from one directory to another directory
// if directory is empty, nothing happens. if dest directory has the same file name, it is overwritten
var moveJson = function (fromSource, toDest, filenameList) {
  // if source or destination is not specified, throw an error
  if (!fromSource || !toDest) { throw "path not specified"; }
  
  // if the filenameList parameter is undefined, then by default move ALL files from Source to Destination
  if (filenameList === undefined) {
    // reads a directory, then uses map to apply the mv function to each of the files
    fs.readdirAsync(fromSource).map(function(filename){

      // specifies which source file to move
      var fileSource = path.join(fromSource, filename);

      // makes the the destination filename is the same as the source
      var fileDest = path.join(toDest, filename);

      // move each file asynchronously from source to destination
      // clobber argument should overwrite destination files
      mv(fileSource, fileDest, {clobber: true}, function (err){ 
        consoleStart(err, 'file move error')
      });
    });
  } else {
    // else move files from source to destination
    for (var i = 0; i < filenameList.length; i++) {
      var fileSource = path.join(fromSource, filenameList[i]);
      var fileDest = path.join(toDest, filenameList[i]);
      mv(fileSource, fileDest, {clobber: true}, function (err){ 
        consoleStart(err, 'file move error')
      });
    }
    // clear files to move
    filesToMove = [];
  }
};

// query the neo4j database, if DB is empty (db error), then all archived files should be moved to the json folder to be re-inserted
// however...need to check when files are created so only recently created files get inserted...hm. older files can get deleted
// *note* add a creation_time parameter to scraper
var checkEmptyDB = function (fromSource, toDest) {
  fromSource = fromSource || scrapeArchive;
  toDest = toDest || testDir;
  rest.postJson(cypherURL, {query:"MATCH (n) RETURN n"})
    .on("complete", function (result, response) {
      if (result.data.length === 0) {
        console.log("\n DB is empty, re-enter all archived files \n");
        moveJson(fromSource, toDest);
      } 
  });
};

/***
 *      ______                                _          
 *     |  ____|                              | |         
 *     | |__    __  __   ___    ___   _   _  | |_    ___ 
 *     |  __|   \ \/ /  / _ \  / __| | | | | | __|  / _ \
 *     | |____   >  <  |  __/ | (__  | |_| | | |_  |  __/
 *     |______| /_/\_\  \___|  \___|  \__,_|  \__|  \___|
 *                                                       
 *                                                       
 */

checkEmptyDB();
startCron();