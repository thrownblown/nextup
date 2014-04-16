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

1. Populate master dictionary by querying DB
   - IF DB is empty, then move all scrapArchived to json (async ok!)
   - alternative, read archived from mongoDB (archive = true, false)
2. After master dict (promise), execute initiate / cron
check hacker news rss feed for new news/sites to scrap
scrape 
   - if there are new urls and save as file.json to json folder 
or mongoDB as alternative
   - read directory and batchInsert
   - move inserted file to archive

*/

var consoleStart            = require('./helpers/commonlyUsed.js').consoleStart;
var clearNeo4jDBAsync       = require('./batchOp.js').clearNeo4jDBAsync;
var populateMasterDictAsync = require('./batchOp.js').populateMasterDictAsync;
var insertBatchRec          = require('./batchOp.js').insertBatchRec;

var moveJson                = require('./cronBatchInsert.js').moveJson;
var readJsonDir             = require('./cronBatchInsert.js').readJsonDir;
var dirPaths                = require('./cronBatchInsert.js').dirPaths;
var toFilenameList          = require('./cronBatchInsert.js').toFilenameList;
var checkEmptyDB            = require('./cronBatchInsert.js').checkEmptyDB;
var startCron               = require('./cronBatchInsert.js').startCron;

var cypherURL = "http://localhost:7474/db/data/cypher";

// move files from archive to original directory, remove in production
moveJson()
.then(function (movedFiles) {
  consoleStart(movedFiles,'files moved from archive to testDir');
})
// clear database for testing purposes, remove in production
.then(function () {
  return clearNeo4jDBAsync();
})
// REAL functions begin here, everything before is for testing and can be cleared
// assuming FRESH db
.then(function () {
  return checkEmptyDB();
})

// checkEmptyDB()
.then(function (isNeo4jEmpty) {
  consoleStart(isNeo4jEmpty, "isNeo4jEmpty ??")
  // if the database is empty, then move archive files back to json folder to be inserted
  if (isNeo4jEmpty) {
    return moveJson();

  // else if it is NOT empty, then populate the master dictionary with words
  } else {
    return populateMasterDictAsync();
  }
})
.catch(function (err) {
  consoleStart(err, "Dict pop error");
})
// *note* good place for cron job?
// read json directory for files to insert
.then(function (results) {
  // return readJsonDir(dirPaths.dummyJSON);
  return readJsonDir(dirPaths.jsonDir);
})
// batch insert json files
.then(function (docList) {
  var filenames = toFilenameList(docList);
  consoleStart(filenames, "files to move to archive after batch insert");
  // should return a list of filenames that were inserted
  insertBatchRec("result", "response", docList, 0);
  // return moveJson(dirPaths.dummyJSON, dirPaths.scrapeArchive, filenames);
  return moveJson(dirPaths.jsonDir, dirPaths.scrapeArchive, filenames);
})
.then(function (movedFiles) {
  consoleStart(movedFiles, 'files moved after batch insert');
})
// now that the initial population / dictionary word retrieval of the neo4j database is finished, the cron job can start?
.then(function () {
  return startCron();
})
.catch(function (err) {
  consoleStart(err, 'catch all errors');
});
