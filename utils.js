var sanitizer = require('sanitizer');

module.exports.stripHTML = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean
    .replace(/<(?:.|\n)*?>/gm, '')
    .replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "\n");
  return clean.trim();
};

module.exports.replaceAllBackSlash = function (targetStr){
  var index=targetStr.indexOf("\\");
  while(index >= 0){
    targetStr=targetStr.replace("\\","");
    index=targetStr.indexOf("\\");
  }
  return targetStr;
};


module.exports.makeJSON = function(str){
  var returnObj = {
    wordtable: {},
    wordcount: 0,
    wordunique: 0
  };
   //split all the words into an array so we can count and consolidate them
  var words = str.split(' ');
  returnObj.wordcount = 0;
  for (var i = 0; i < words.length; i++){
    if (words[i].length<20&&!parseInt(words[i])){
      words[i] = words[i].toLowerCase();
      //using the word as a hash-key, its value is the number of occurrences of the key-word in each document
      if (words[i] in returnObj.wordtable){
        returnObj.wordcount++;
        returnObj.wordtable[words[i]]++;
      } else {
        returnObj.wordcount++;
        returnObj.wordtable[words[i]] = 0;
      }
    }
  }
  for(var e in returnObj.wordtable) {
    if(returnObj.wordtable.hasOwnProperty(e)){
      returnObj.wordunique++;
    }
  }
return returnObj;
}