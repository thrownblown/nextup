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
    var loc  = result.data[i][0].self;
    var nodeNum = getNodeNum(loc);
    console.log("inside for: ", word, loc, nodeNum);

    // populating master dictionary
    master[word] = {};
    master[word].loc = loc;
    master[word].nodeNum = nodeNum;
  }
  console.log("inside addToDict: ", master);
}

// assumption: only create a master dictionary during big batch imports
// master dictionary has word and it's node location in the neo4j database
var masterDict = {};
var masterDictQuery = function () {
  var data = {};
  data.query = "MATCH (w:Word) RETURN w";
  return data;
};

var dummyDoc = {
  words : {
    i : 1,
    like: 1,
    dogs: 1
  },
  length : 3,
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
    addToDict(result, masterDict);
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
