TODO: 
1. prepare for production
2. have a function that turns on testing / turn off??
3. NO, should be writing tests!!!!!!
4. updateRelatinoshipIndex - WRONG KEY, 'TF' is capitalized

=========
vars
=========

batchURL, cypherURL

masterDict, wordsToAdd, wordsToUpdate

============
functions
============

// return last digits of a http link
getNodeNum(address)

// result from cypher query
addToDict(result, master)

// updates the master dictionary on server side
updateDict(newWords, result, num);

// updates the property 'connections' of words in the master dictionary
updateConnections(arrayWordsToUpdate, reuslts, num)

// returns cypher http rest query that retrieves all words in db
masterDictQuery()

// returns a cypher http rest query that CLEARS the neo4j db
clearQuery()

----

// returns query object with requestID
insertDocBatch(doc, reqID)

// returns
insertWordBatch(word, reqID)

//
addLabelBatch(label, nodeID, reqID)

// 
createRelationshipBatch(docID, wordID, reqID, isInMasterDict, tfValue)

// some thing that HAS to be updated
updateRelationshipIndexBatch(relationshipID, reqID, tfValue)

// updates a specific property on a specific node
updatePropertyBatch(arg, nodeID, reqID, property, isInMasterDict);

//
getPropertyBatch(nodeID, reqID, property, isInMasterDict)

// inserts a whole document, and creates connections to those words
batchInsert(doc, requestID, num)

// recursive function that inserts documents ONE AT A TIME
insertBatchRec(result, response, documentList, num)

// clears the neo4j database and returns a promise upon completion
// *really just sends a query (option), and returns a promise
clearNeo4jDBAsync(neo4jCypherURL, option)

// queries neo4j db for word nodes and adds to global dictionary
populateMasterDictAsync(result, url, option)

-------

cosineSimilarityInsertion(url)

===============
refactor
===============

if word is IN dictionary: 
  insertWord
  .addLabel
  .createRelationship
  .updateProperty
  .getProperty
  .then(wordsToAdd.push()) // executes after server returns success!

else
  retrieveWordFromDic
  .createRelationship
  .updateProperty
  .getProperty
  .then(wordsToUpdate.push()) // executes after server returns success!

===============
Dummy data
===============

dummyDoc1, dummyDoc2, dummyDoc3

// real scraped data
rd1...rd20

docList

===============
module exports
===============

.dummyList
.clearNeo4jDBAsync
.populateMasterDictAsync
.insertBatchRec