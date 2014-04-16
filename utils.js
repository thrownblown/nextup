var sanitizer = require('sanitizer');

//http://www.commitstrip.com/en/2014/02/24/coder-on-the-verge-of-extinction/

module.exports.stripHTML = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean.replace(/<(?:.|\n)*?>/gm, "");
  clean = clean.replace(/(?:(?:\r\n|\r|\n|\t)\s*){2,}/ig, " ");
  clean = clean.replace("\\n", " ");
  clean = clean.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  clean = clean.replace(/\s{2,}/g," ");
  return clean.trim();
};

module.exports.replaceAllBackSlash = function (targetStr){
  var index=targetStr.indexOf('\\');
  while(index >= 0){
    targetStr=targetStr.replace('\\',"");
    targetStr=targetStr.replace(/\\/g, " ");
    targetStr=targetStr.replace("\\n", " ");
    index=targetStr.indexOf('\\');
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
      //using the word as a hash-key, its value is the number of 
      //occurrences of the key-word in each document
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
