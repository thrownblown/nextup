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
  0. ALL functions to be executed (except global/dependencies) or exported are at the bottom of this page

  1. read './json' directory and create an array of those files (async)
  2. batch insert into Neo4j the array of parsed objects (async)
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

var dirPaths = {
  jsonDir: jsonDir,
  scrapeArchive: scrapeArchive,
  dummyJSON: dummyJSON
};

// uncomment one of the below to test 
// in production version, change all cases of testDir to jsonDir
// var testDir = dummyJSON;
var testDir = jsonDir;


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
  time = time || "*/10 * * * * *";
  return new CronJob.CronJob(time, function () {
    console.log( "every 10 seconds execute checkDir");
    checkDir(testDir);
  }, null, true, "America/Los_Angeles");
};

// checks the JSON directory by default for any files, inserts them using batchOperations, then moves those JSON files to the archive
var checkDir = function (dir) {
  dir = dir || testDir
  readJsonDir(dir)
    .then(function (fileList) {
      console.log('what is fileList: ', fileList);
      if (fileList.length > 1 || fileList[0] !== undefined) {
        var filenames = toFilenameList(fileList);
        consoleStart(filenames, "files to archive after cron batch insert");
        // should return a list of filenames that were inserted
        batch.insertBatchRec("result", "response", fileList, 0);
        return moveJson(testDir, scrapeArchive, filenames);
      }
    })
    .catch(function (err) {
      consoleStart(err, "readJsonDir errored in Cron");
    });
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
  fromSource = fromSource || testDir;
  consoleStart(fromSource, "read json dir");
  var count = 0;
  return fs.readdirAsync(fromSource).map(function (filename, index) {
    console.log("map filename: ", filename);

    // if statment is to ignore hidden files
    if (filename[0] !== '.') {
      var fileSource = path.join(fromSource, filename);
      filesToMove.push(filename);
      return fs.readFileAsync(fileSource, "utf8")
        .then( function (result) {
          // console.log(filename, 'is about to be parsed, count: ', count, "/187" );
          return JSON.parse(result);
        });
    } else {
      return undefined;
    }
  });
};

// moves specific files from one directory to another directory
// if directory is empty, nothing happens. if dest directory has the same file name, it is overwritten
// returns an array of filenames that were moved
var moveJson = function (fromSource, toDest, filenameList) {
  // if source or destination is not specified, by default move everything from archive BACK to testDir
  fromSource = fromSource || scrapeArchive;
  toDest = toDest || testDir;

  // if the filenameList parameter is undefined, then by default move ALL files from Source to Destination
  if (filenameList === undefined) {
    var filenameListPromise = fs.readdirAsync(fromSource);
  } else {
    console.log( 'is filenameList executed' );
    filenameListPromise = Promise.resolve(filenameList);
  }

  // reads a directory, then uses map to apply the mv function to each of the files
  // return fs.readdirAsync(fromSource).map(function(filename){
  return filenameListPromise.map(function(filename){

    // specifies which source file to move
    var fileSource = path.join(fromSource, filename);

    // makes the the destination filename is the same as the source
    var fileDest = path.join(toDest, filename);

    // move each file asynchronously from source to destination
    // clobber property should overwrite destination files
    // mkdirp property should create directory if not exist
    return new Promise(function (resolve, reject) {
      mv(fileSource, fileDest, {clobber: true, mkdirp: true}, function (err){
        if (err) {
          consoleStart(err, 'file move error');
          reject(err);
        } else {
          resolve(filename);
        }
      });
    }); // end of mv promise
  });   // end of map promise

  filesToMove = [];
};

// converts json object files BACK to list of file names
var toFilenameList = function (documentList) {
  consoleStart(documentList, "files to be converted");
  var result = [];
  for (var i = 0; i < documentList.length; i++) {
    var item = documentList[i];
    // prevent reading hidden system files
    if (item !== undefined) {
      result.push(item.file + '.json');
    }
  }
  console.log('converted result', result);
  return result;
};

// query the neo4j database, if DB is empty (db error), then all archived files should be moved to the json folder to be re-inserted
// however...need to check when files are created so only recently created files get inserted...hm. older files can get deleted
// *note* add a creation_time parameter to scraper
var checkEmptyDB = function (fromSource, toDest) {
  fromSource = fromSource || scrapeArchive;
  toDest = toDest || testDir;

  return new Promise (function (resolve, reject) {
    rest.postJson(cypherURL, {query:"MATCH (n) RETURN n"})
      .on("complete", function (result, response) {
        if (result instanceof Error) {
          throw 'err checking if neo4j is empty';
        } else {
          console.log("\n DB empty, re-insert all archived files \n");
          resolve(result.data.length === 0);
        }
      });
  });
};

/***
 *      ______                                 _         
 *     |  ____|                               | |        
 *     | |__    __  __  _ __     ___    _ __  | |_   ___ 
 *     |  __|   \ \/ / | '_ \   / _ \  | '__| | __| / __|
 *     | |____   >  <  | |_) | | (_) | | |    | |_  \__ \
 *     |______| /_/\_\ | .__/   \___/  |_|     \__| |___/
 *                     | |                               
 *                     |_|                               
 */

module.exports.readJsonDir = readJsonDir;
module.exports.moveJson = moveJson;
module.exports.dirPaths = dirPaths;
module.exports.toFilenameList = toFilenameList;
module.exports.checkEmptyDB = checkEmptyDB;
module.exports.startCron = startCron;

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


// checkEmptyDB();
// startCron();