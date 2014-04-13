var rest = require('restler');

exports.cosSimFetch = function(url, title, cosSim, limit) {
  cosSim = cosSim || 0.0;
  limit = limit || 5;
  var query = {
    query: "MATCH (a:Document { title: '" + title + "' } )-[s:SIMILARITY]-(b:Document) WHERE s.similarity > " + cosSim + " WITH s.similarity AS sim,a,b ORDER BY sim desc LIMIT " + limit + " RETURN b,sim"
  };
  rest.postJson(url, query)
  .on("complete", function(result, response) {
    console.log("\nTop " + limit + " similar documents to: " + title + "\n");
    for (var i = 0; i < result.data.length; i++) {
      console.log("Title: ", result.data[i][0].data.title, "\nSimilarity: ", result.data[i][1], "\n");
    }
  });
};