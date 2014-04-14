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

var consoleStart = require('./helpers/commonlyUsed.js').consoleStart;
var clearNeo4jDBAsync = require('./batchOp.js').clearNeo4jDBAsync;
var populateMasterDictAsync = require('./batchOp.js').populateMasterDictAsync;

var data = {};
data.query = 'CREATE (w: Word {word: "testPromise", connections: 1 }) RETURN w;';
var cypherURL = "http://localhost:7474/db/data/cypher";

clearNeo4jDBAsync()
.then(function (result) {
  return clearNeo4jDBAsync(cypherURL, data)
})
.then(function (result) {
  return populateMasterDictAsync(result);
})
.then(function (result) {
  consoleStart(result, "Master dict results");
})
.catch(function(err){
  consoleStart(err, "someError");
});
