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
var masterDictQuery = function () {
  var data = {};
  data.query = "MATCH (w:Word) RETURN w";
  return data;
};

// DUMMY DATA
var dummyDoc = {
  title : "greg report",
  url   : "http://www.gregorylull.com",
  words : {
    i    : 1,
    like : 1,
    dogs : 1
  },
  length : 3,
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
  var toDoc;
  var toNodeRel;

  // if the word was 
  if (isInMasterDict) {
    toDoc = docID + "/relationships";
    toNodeRel = "" + wordID;
  } else {
    toDoc = "{" + docID + "}/relationships";
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

  // iterate through words and create queries in order
  for (var word in doc.words) {
    // if word is not in list, insert word node first THEN create relationship
    if (masterDict[word] === undefined) {
      var wordCMD = insertWordBatch(word, requestID);
      query.push(wordCMD.cmd);
      requestID++;

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

// query database to create master dictionary
rest.postJson(cypherURL, masterDictQuery())
  .on("complete", function (result, response) {
    // create a dictionary first after querying
    addToDict(result, masterDict);

    // batch operation to insert document and its relationship with words
    rest.postJson(batchURL, batchInsert(dummyDoc).query)
      .on("complete", function (result, response) {
        consoleStart(result, "RESULT after batch insert");
        consoleStart(response, "RESPONSE after batch insert");
        // for (var i = 0; i < result.data.length; i++) {
        //   console.log(result[i][0]);
        // }
      });
  });

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
