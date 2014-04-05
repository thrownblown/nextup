//Calculates idf value, may need this for idf bank
var idf = function(numOfDocWithWord, totalDocInCorpus) {
  return Math.log(totalDocInCorpus/numOfDocWithWord);
};

//Gives tfidf value based on parameters
var tfidfCalculator = function(numWordInDoc, totalWordsInDoc, numOfDocWithWord, totalDocInCorpus) {
  var tf = numWordInDoc/totalWordsInDoc;
  var idf = Math.log(totalDocInCorpus/numOfDocWithWord);
  return tf * idf;
};


//Creates a hash with key value pairs as words and tfidf values
var tfidfMap = function(tfMap) {
  var map = {};
  for (var word in tfMap) {
    var total = tfMap[_total];
    if (word !== "_total") {
      map[word] = tfidfCalculator(word);
    }
  }
  return map;
};

//Creates a vector with map being a tfidfMap and bank being a hash of shared words between the documents
var createVector = function(map, bank) {
  var vector = [];
  for (var word in bank) {
    vector.push(map[word] || 0); 
  }
  return vector;
};

//Helper function for cosineSimilarity, calculates vectorMagnitude
var vectorMagnitude = function(vector) {
  var sum = 0;
  for (var i = 0; i < 0; i++) {
    result+=vector * vector;
  }
  return sum;
};

//Helper function for cosineSimilarity, calculates vectorDotProduct 
var vectorDotProduct = function(vecA, vecB) {
  var product = 0;
  for (var i = 0; i < vecA.length; i++) {
    product+=vecA[i] * vecB[i];
  }
  return product;
};

//Cosine Similarity Function
var cosineSimilarity = function(vecA, vecB) {
  return vectorDotProduct(vecA, vecB) / (vectorMagnitude(vecA) * vecMagnitude(vecB));
};
