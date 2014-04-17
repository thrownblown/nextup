/*
PLAN:
  a. create master dictionary
    1. query database for all word nodes
    2. add word nodes to master dictionary
  b. doc insertion
    1. insert doc node
    2. check if word node is in master/server
       - if yes -> create relationship between doc and word
       - if no  -> create word node, create relationship between doc and word
  c. if doc and word insertion is successful, update master dictionar
  d. insert rest of doc recursively
*/
var docFetch = require("./docFetch.js");
var rest = require('restler');
var Promise = require('bluebird');

var batchURL = process.env.BATCH || "http://localhost:7474/db/data/batch";
var cypherURL = process.env.CYPHER || "http://localhost:7474/db/data/cypher";

var consoleStart = require('./helpers/commonlyUsed.js').consoleStart;
// helper functions

var getNodeNum = function (nodeAddress) {
  var regexp = /[0-9]*$/g;
  return nodeAddress.match(regexp)[0];
};

// extracts words and their properties from the result of a cypher "Match (w:Word)" query and inserts them into the global object masterDict
var addToDict = function (result, master) {
  var len = result.data.length;
  console.log("len: ", len);

  for (var i = 0; i < len; i++) {
    var word = result.data[i][0].data.word;
    if (master[word] === undefined) {
      var loc  = result.data[i][0].self;
      var nodeNum = getNodeNum(loc);
      var connections = result.data[i][0].data.connections;
      console.log("inside for: ", word, loc, nodeNum);

      // populating master dictionary
      master[word] = {};
      master[word].loc = loc;
      master[word].nodeNum = nodeNum;
      master[word].word = word;
      master[word].connections = connections;

      // increase dictionary size
      master._size++;
    }
  }
  consoleStart(master, "Master Dict words");
  return master;
};

// assumption: only create a master dictionary during big batch imports
// master dictionary has word and it's node location in the neo4j database
var masterDict = {_size: 0};
var wordsToAdd = [];
var wordsToUpdate = [];

var masterDictQuery = function () {
  var data = {};
  data.query = "MATCH (w:Word) RETURN w";
  return data;
};

var clearQuery = function () {
  var data = {};
  data.query = "MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r";
  return data;
};

// creates the query to insert a doc
// returns an obj with the query and its request id {query: query, reqID: reqID}
var insertDocBatch = function (doc, reqID) {
  reqID = reqID || 0;
  var cmd = {};
  cmd.method = "POST";
  cmd.to = "/node";
  cmd.id = reqID;
  cmd.body = {
    "title" : doc.title,
    "url"   : doc.link
  };
  return {cmd: cmd, reqID: reqID};
};

var insertWordBatch = function (word, reqID) {
  reqID = reqID || 0;
  var cmd = {};

  cmd.method = "POST";
  cmd.to = "/node";
  cmd.id = reqID;
  cmd.body = {
    "word" : word,
    "connections": 0
  };

  return {cmd: cmd, reqID: reqID};
};

var addLabelBatch = function (label, nodeID, reqID) {
  var cmd = {};
  cmd.method = "POST";
  cmd.id = reqID;
  cmd.to = "{" + nodeID +"}/labels";
  cmd.body = [label];

  return {cmd: cmd, reqID: reqID};
};

var createRelationshipBatch = function (docID, wordID, reqID, isInMasterDict, tfValue) {
  var toDoc = "{" + docID + "}/relationships";
  var toNodeRel;

  // if the word was
  if (isInMasterDict) {
    toNodeRel = "" + wordID;
  } else {
    toNodeRel = "{" + wordID +"}";
  }

  reqID = reqID || 0;
  var cmd = {};

  cmd.method = "POST";
  cmd.to = toDoc;
  cmd.id = reqID;
  cmd.body = {
    to: toNodeRel,
    data: {
      tf : tfValue
    },
    type: "HAS"
  };
  return {cmd: cmd, reqID: reqID};
};

// not exactly sure why this relationship needs to be created / updated
// *question* when updating properties ON relationships, does this need to be updated?
var updateRelationshipIndexBatch = function (relationshipID, reqID, tfValue) {
  var cmd = {};
  cmd.id = reqID;
  cmd.method = "POST";
  cmd.to = "/index/relationship/my_rels";
  cmd.body = {
    uri : "{" + relationshipID + "}",
    key : "TF",
    value : tfValue
  };
  return {cmd: cmd, reqID: reqID };
};

// updates a specific property on a specific node
// last parameter (isInMasterDict) specifies whether the nodeID should be relative to the entire batch query it is part of, or to a specific node
var updatePropertyBatch = function (arg, nodeID, reqID, property, isInMasterDict) {
  var nodeNum = "/node/" + nodeID;
  // return no curly brace
  if (!isInMasterDict) {
    nodeNum = "{" + nodeID + "}";
  }
  var cmd = {};
  cmd.id = reqID;
  cmd.method = "PUT";
  cmd.to = nodeNum + "/properties/" + property;
  cmd.body = arg;

  return {cmd: cmd, reqID: reqID};
};

// get property from node
var getPropertyBatch = function (nodeID, reqID, property, isInMasterDict) {
  var nodeNum = "/node/" + nodeID;
  // return no curly brace
  if (!isInMasterDict) {
    nodeNum = "{" + nodeID + "}";
  }
  var cmd = {};
  cmd.id = reqID;
  cmd.method = "GET";
  cmd.to = nodeNum + "/properties/" + property;

  return {cmd: cmd, reqID: reqID};
};

var batchInsert = function (doc, requestID, num) {
  requestID = requestID || 0;
  var query = [];

  // initial step is to create a command to insert the doc
  // *note* every command is a new request so ID has to be updated
  var docCMD = insertDocBatch(doc, requestID);
  query.push(docCMD.cmd);
  requestID++;

  // add label to Doc
  var labelCMD = addLabelBatch("Document", docCMD.reqID, requestID);
  query.push(labelCMD.cmd);
  requestID++;

  // iterate through words and create queries in order
  for (var word in doc.wordtable) { 
    if (word !== "" && doc.wordtable[word] !== undefined && doc.wordtable[word] !== null) {
      // if word is not in master dictionary, insert word node first THEN create relationship
      var tfValue = (doc.wordtable[word] / (doc.wordcount+1)).toFixed(10);
      if (masterDict[word] === undefined) {
        var wordCMD = insertWordBatch(word, requestID);
        query.push(wordCMD.cmd);
        requestID++;

        // add a label to the word
        var labelCMD = addLabelBatch("Word", wordCMD.reqID, requestID);
        query.push(labelCMD.cmd);
        requestID++;

        // create relationship
        var relCMD = createRelationshipBatch(docCMD.reqID, wordCMD.reqID, requestID, false, tfValue);
        query.push(relCMD.cmd);
        requestID++;

        // update relationship index
        var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID, tfValue);
        query.push(relIndexCMD.cmd);
        requestID++;

        // update word node connection/relationship number
        var updateConCMD = updatePropertyBatch(1, wordCMD.reqID, requestID, "connections", false);
        query.push(updateConCMD.cmd);
        requestID++;

        // get 'connection' property from node
        var getConCMD = getPropertyBatch(wordCMD.reqID, requestID, "connections", false);
        query.push(getConCMD.cmd);
        requestID++;

        // add word to list of words to be added to master dict after batch op. complete
        wordsToAdd.push({word: word, reqID: wordCMD.reqID, connectionID: getConCMD.reqID});

      // else word exists in the master dict, so create relationships from that
      } else {
        // find the word's node from masterDict and create a relationship
        var wordNodeNum = masterDict[word].nodeNum;
        var wordConNum  = masterDict[word].connections;
        var relCMD = createRelationshipBatch(docCMD.reqID, wordNodeNum, requestID, true, tfValue);
        query.push(relCMD.cmd);
        requestID++;

        // update word node connection/relationship number
        var updateConCMD = updatePropertyBatch(wordConNum+1, wordNodeNum, requestID, "connections", true);
        query.push(updateConCMD.cmd);
        requestID++;

        // get 'connection' property from node
        var getConCMD = getPropertyBatch(wordNodeNum, requestID, "connections", true);
        query.push(getConCMD.cmd);
        requestID++;

        // update connections in the master Dict
        wordsToUpdate.push({word: word, connectionID: getConCMD.reqID});

        // update the relationship index
        var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID, tfValue);
        query.push(relIndexCMD.cmd);
        requestID++;
      }
    }

  }
  consoleStart(query, "Batch Insert Query " + num);
  return {query: query, reqID: requestID};
};

// updates the master dictionary on the server side
var updateDict = function (newWords, result, num) {
  num = num || 0;
  for (var i = 0; i < newWords.length; i++) {
    var word = newWords[i].word;
    var id = newWords[i].reqID;
    var conID = newWords[i].connectionID;

    // retrieve information from result object
    var resultObj = result[id];
    var loc = resultObj.location;
    var nodeNum = getNodeNum(loc);
    var connections = result[conID].body;

    // adds word into the master dictionary
    masterDict[word] = {};
    masterDict[word].word = word;
    masterDict[word].nodeNum = nodeNum;
    masterDict[word].loc = loc;
    masterDict[word].connections = connections;

    // update the size of the dictionary
    masterDict._size++;
  }
  consoleStart(wordsToAdd, "newly added words: " + num);
  consoleStart(masterDict, "current master Dict " + num);
  // empty the words to be added
  wordsToAdd = [];
  return masterDict;
};

var updateConnections = function (wToUpdate, results, num) {
  num = num || 0;
  for (var i = 0; i < wToUpdate.length; i++) {
    var word = wToUpdate[i].word;
    var conID = wToUpdate[i].connectionID;

    // retrieve information from result object
    var connections = results[conID].body;

    // update master dictionary
    masterDict[word].connections = connections;
  }
  consoleStart(wToUpdate, "Master Dict updated connections " + num);

  // empty the words to be updated
  wordsToUpdate = [];
  return masterDict;
};
// Creates tfidf properties, creates vectors and cosine similarity
var cosineSimilarityInsertion = function(url) {
  var tfidfQuery = { query: "MATCH (n:Document) WITH count(DISTINCT n) AS totalDocs MATCH (d:Document)-[r:HAS]->(w:Word) WITH r.tf AS tf,w.connections AS totalRel,1.0+1.0*(log((totalDocs)/(w.connections))) AS idf,d,r,w SET r.TFIDF = toFloat(tf) * toFloat(idf)"};
  var vectorQuery = { query: "MATCH (d:Document)-[r:HAS]->(w:Word) WITH SQRT(REDUCE(dot = 0, a IN COLLECT(r.TFIDF) | dot + a*a)) AS vector, d SET d.vector = vector"};
  var cosSimQuery = { query: "MATCH (d1:Document)-[x:HAS]->(w:Word)<-[y:HAS]-(d2:Document) WITH SUM(x.TFIDF * y.TFIDF) AS xyDotProduct, d1.vector AS xMagnitude, d2.vector AS yMagnitude, d1, d2 CREATE UNIQUE (d1)-[s:SIMILARITY]-(d2) SET s.similarity = xyDotProduct / (xMagnitude * yMagnitude)"};
  rest.postJson(url, tfidfQuery)
  .on("complete", function(result, response) {
    console.log("TFIDF Query Complete", result, "Starting Vector Query");
    rest.postJson(url, vectorQuery)
    .on("complete", function(result, response) {
      console.log("Vector Query Complete", result, "Starting Cosine Similarity Query");
      rest.postJson(url, cosSimQuery)
      .on("complete", function(result, response) {
        console.log("Cosine Similarity Query Complete", result);
        // Test Cosine Similarity fetcher
        // docFetch.cosSimFetch(url, "https://www.dropboxatwork.com/2014/04/new-dropbox-business/", 0.0, 10);
      });
    });
  });
};

// recursive function that inserts docs only when the previous document has been inserted
var insertBatchRec = function (result, response, documentList, num) {
  // num is for debugging purposes, shows which queries goes with which results
  num = num || 0;
  consoleStart(result, "Result after " + num + " insert");

  // after words have been successfully inserted into the db, the dictionary has to be udpated
  updateDict(wordsToAdd, result, num);

  // pre-existing dictionary words will have their connections updated to reflect what is stored in the db
  updateConnections(wordsToUpdate, result, num);

  // the second OR argument executes if the document list contains hidden system files that should not have been read
  if (documentList.length === 0 || documentList[documentList.length-1] === undefined) {
    cosineSimilarityInsertion(cypherURL);
    return; 
  }

  // note, instead of popping off an item and and mutating original, maybe just count?
  // double note, since the directory is read alphabetical order (i think), be careful of hidden files
  var doc = documentList.pop();

  rest.postJson(batchURL, batchInsert(doc, 0, num+1).query)
    .on("complete", function (result, response) {
      insertBatchRec(result, response, documentList, ++num);
    });
};

// after the last insertion

// clear data base first for testing purposes
// rest.postJson(cypherURL, clearQuery()).on("complete", function (result, response) {
//   // query database to create master dictionary
//   rest.postJson(cypherURL, masterDictQuery())
//     .on("complete", function (result, response) {
//       // create a dictionary first after querying
//       addToDict(result, masterDict);

//       insertBatchRec(result, response, docList, 0);

//     });
// });

// clears the database and returns a bluebird promise
var clearNeo4jDBAsync = function (url, option) {
  url = url || cypherURL;
  option = option || clearQuery();
  return new Promise(function (resolve, reject) {
    rest.postJson(url, option).on("complete", function (result, response){
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
};

// queries the Neo4j db for all word nodes and adds them to the global master dict object
var populateMasterDictAsync = function (result, url, option) {
  url = url || cypherURL;
  option = option || masterDictQuery();
  return new Promise(function (resolve, reject) {
    rest.postJson(url, option).on("complete", function (result, response){
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(addToDict(result, masterDict));
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


module.exports.clearNeo4jDBAsync = clearNeo4jDBAsync;
module.exports.populateMasterDictAsync = populateMasterDictAsync;
module.exports.insertBatchRec = insertBatchRec;


// REFERENCE
/*
  http://localhost:7474/db/data/index/relationship/MyIndex/?uniqueness=get_or_create
  {
    "key" : "name",
    "value" : "Greg",
    "start" : "http://127.0.0.1:7474/db/data/node/49",
    "end" : "http://127.0.0.1:7474/db/data/node/48",
    "type" : "tf"
}
*/
