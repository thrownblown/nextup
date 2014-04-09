// for batch operations http://localhost:7474/db/data/batch
var rest = require('restler');

var batchURL = "http://localhost:7474/db/data/batch";
var cypherURL = "http://localhost:7474/db/data/cypher";

// helper functions
var consoleStart = function (data, title) {
  var title = title || "";
  console.log("\n\n");
  console.log("********** BEGIN " + title + " **********" + "\n\n");
  console.log(data);
  console.log("\n\n********** END " + title + " **********");
  console.log("\n\n");
};

var getNodeNum = function (nodeAddress) {
  var regexp = /[0-9]*$/g;
  return nodeAddress.match(regexp)[0];
};

var addToDict = function (result, master) {
  var len = result.data.length;
  console.log("len: ", len);

  for (var i = 0; i < len; i++) {
    var word = result.data[i][0].data.word;
    if (master[word] === undefined) {
      var loc  = result.data[i][0].self;
      var nodeNum = getNodeNum(loc);
      console.log("inside for: ", word, loc, nodeNum);

      // populating master dictionary
      master[word] = {};
      master[word].loc = loc;
      master[word].nodeNum = nodeNum;
      master[word].word = word;
    }
  }
  consoleStart(master, "Master Dict words");
};

// assumption: only create a master dictionary during big batch imports
// master dictionary has word and it's node location in the neo4j database
var masterDict = {};
var wordsToAdd = [];

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

// DUMMY DATA
var dummyDoc1 = {
  title : "greg one",
  url   : "http://www.gregorylull.com",
  words : {
    i    : 1,
    like : 1,
    dogs : 1
  },
  length : 3,
};

var dummyDoc2 = {
  title : "greg two",
  url   : "http://www.iamthelull.com",
  words : {
    i    : 1,
    want : 1,
    dogs : 1
  },
  length : 3,
};

var dummyDoc3 = {
  title : "greg three",
  url   : "http://www.glull.com",
  words : {
    i    : 1,
    need : 1,
    dogs : 1,
    too  : 1
  },
  length : 4,
};

var docList = [dummyDoc1, dummyDoc2, dummyDoc3];

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
    "url"   : doc.url
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
    "word" : word
  };

  return {cmd: cmd, reqID: reqID};
};

var addLabelBatch = function (label, nodeID, reqID) {
  var cmd = {};
  cmd.method = "POST";
  cmd.id = reqID;
  cmd.to = "{" + nodeID +"}/labels"
  cmd.body = [label];

  return {cmd: cmd, reqID: reqID};
};

var createRelationshipBatch = function (docID, wordID, reqID, isInMasterDict) {
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
      TF : 123
    },
    type: "HAS"
  };
  return {cmd: cmd, reqID: reqID};
};

var updateRelationshipIndexBatch = function (relationshipID, reqID) {
  var cmd = {};
  cmd.id = reqID;
  cmd.method = "POST";
  cmd.to = "/index/relationship/my_rels";
  cmd.body = {
    uri : "{" + relationshipID + "}",
    key : "TF",
    value : 123
  };
  return {cmd: cmd, reqID: reqID };
};

var batchInsert = function (doc, requestID) {
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
  requestID++

  // iterate through words and create queries in order
  for (var word in doc.words) {
    // if word is not in list, insert word node first THEN create relationship
    if (masterDict[word] === undefined) {
      var wordCMD = insertWordBatch(word, requestID);
      query.push(wordCMD.cmd);
      requestID++;

      // add word to list of words to be added to master dict after batch op. complete
      wordsToAdd.push({word: word, reqID: wordCMD.reqID});

      // add a label to the word
      var labelCMD = addLabelBatch("Word", wordCMD.reqID, requestID);
      query.push(labelCMD.cmd);
      requestID++

      // create relationship
      var relCMD = createRelationshipBatch(docCMD.reqID, wordCMD.reqID, requestID);
      query.push(relCMD.cmd);
      requestID++;

      // update relationship index
      var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID);
      query.push(relIndexCMD.cmd);
      requestID++;

    // else word exists in the master dict, so create relationships from that
    } else {
      // find the word's node from masterDict and create a relationship
      var wordNodeNum = masterDict[word].nodeNum;
      var relCMD = createRelationshipBatch(docCMD.reqID, wordNodeNum, requestID, true);
      query.push(relCMD.cmd);
      requestID++;

      // update the relationship index
      var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID);
      query.push(relIndexCMD.cmd);
      requestID++;
    }

  }
  consoleStart(query, "Batch Insert Query");
  return {query: query, reqID: requestID};
};

/*
  a. create master dictionary
    1. query database for all word nodes
    2. add word nodes to master dictionary
  b. doc insertion
    1. insert doc node
    2. check if word node is in master/server
       - if yes -> create relationship
       - if no  -> create word node, create relationship

  c. if doc and word insertion is successful, update master Dict?
*/

var updateDict = function (newWords, result) {
  for (var i = 0; i < newWords.length; i++) {
    var word = newWords[i].word;
    var id = newWords[i].reqID;
    var resultObj = result[id];
    var loc = resultObj.location;
    var nodeNum = getNodeNum(loc);
    masterDict[word] = {};
    masterDict[word].word = word;
    masterDict[word].nodeNum = nodeNum; 
    masterDict[word].loc = loc;
  }
  consoleStart(masterDict, "Newly added words");
  // empty the words to be added
  newWords = [];
  return masterDict;
};

// clear data base first for testing purposes
rest.postJson(cypherURL, clearQuery()).on("complete", function (result, response) {
  // query database to create master dictionary
  rest.postJson(cypherURL, masterDictQuery())
    .on("complete", function (result, response) {
      // create a dictionary first after querying
      addToDict(result, masterDict);

      // batch operation to insert document and its relationship with words
      rest.postJson(batchURL, batchInsert(dummyDoc1).query)
        .on("complete", function (result, response) {
          consoleStart(result, "RESULT after first batch insert");
          updateDict(wordsToAdd, result);

          rest.postJson(batchURL, batchInsert(dummyDoc2).query)
            .on("complete", function (result, response){
              consoleStart(result, "RESULT after SECOND batch insert");
            });
        });
    });
});

var insertBatchRec = function (result, response, docList, num) {
  if (docList.length === 0) { return; }
  consoleStart(result, "Result after " + num + " insert");
  updateDict(wordsToAdd, result);
  var doc = docList.pop();
  rest.postJson(batchUrl, batchInsert(doc).query)
    .on("complete", function (result, response) {
      insertBatchRec(result, response, docList, ++num);
    });
};

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
