var rest = require('restler');
var Promise = require('bluebird');

exports.cosSimFetch = function(cypherURL, docURL, cosSim, limit) {
  return new Promise(function(resolve, reject) {
    console.log("Looking for ", docURL, " inside neo4j!");
    cosSim = cosSim || 0.0;
    limit = limit || 5;
    var resultArray = [];
    var query = {
      query: "MATCH (a:Document { url: '" + docURL + "' } )-[s:SIMILARITY]-(b:Document) WHERE s.similarity > " + cosSim + " WITH s.similarity AS sim,a,b ORDER BY sim desc LIMIT " + limit + " RETURN b,sim"
    };
    rest.postJson(cypherURL, query)
    .on("success", function(result) {
      console.log("\nTop " + limit + " similar documents to: " + docURL + "\n");
      for (var i = 0; i < result.data.length; i++) {
        var sim = { title: result.data[i][0].data.title, url: result.data[i][0].data.url, similarity: result.data[i][1], };
        resultArray.push(sim);
        console.log("Title: ", result.data[i][0].data.title, "\nSimilarity: ", result.data[i][1], "\nUrl: ", result.data[i][0].data.url, "\n");
      }
      console.log("Result Array: ", resultArray);
      resolve(resultArray);
    })
    .on("failure", function(result) {
      console.log("FAILUREEEEEE NOOOO ", result);
      reject(result);
    });
  });
};