var sanitizer = require('sanitizer');
var Promise = require("bluebird");

//http://www.commitstrip.com/en/2014/02/24/coder-on-the-verge-of-extinction/

module.exports.stripHTML = strip = function (html) {
  var clean = sanitizer.sanitize(html, function (str) {
    return str;
  });
  clean = clean.replace(/<(?:.|\n)*?>/gm, " ");
  clean = clean.replace(/(?:(?:\r\n|\r|\n|\t)\s*){2,}/ig, " ");
  clean = clean.replace("\n", " ");
  //clean = clean
    //.replace(/[\.,-\/#!$%\^&\*;:{}=\-_\?\[\]|∀→+▼►¬≡⊆⊇⊔γ”“‵³β✴×λ²↔∧₀∈⊈πςπ⊥ℕ⊤≤∷`₁′’ℓ‵∉~()čššñç한국어한국어한국어简体中文本語日語êâăкийсภาษาไทยภาษาไทยภาษาไทยü]/g," ");
  clean = clean.replace(/\s{2,}/g," ");
  clean = clean.replace(/"/g," ");
  clean=clean.replace("\t", " ");
  clean=clean.replace("'", " ");

  return clean;
};

module.exports.replaceAllBackSlash = noback = function (targetStr){
  var index=targetStr.indexOf('\\');
  while(index >= 0){
    targetStr=targetStr.replace('\\'," ");
    targetStr=targetStr.replace(/\\/g, " ");
    index=targetStr.indexOf('\\');
  }
  return targetStr;
};

module.exports.replaceAllNewLine = noNew = function (targetStr){
  var index=targetStr.indexOf("\n");
  while(index >= 0){
    targetStr=targetStr.replace(/\\n/g, " ");
    targetStr=targetStr.replace("\\n", " ");
    targetStr=targetStr.replace("\n", " ");
    index=targetStr.indexOf("\n");
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
    //filter out common words, long words that somehow got concatenated
    // into gibberish and words that consist of only numbers

    if (!commonWords[words[i]] || (words[i].length<20 && !parseInt(words[i]))) {
      
      words[i] = words[i].toLowerCase();
      words[i] = noback(words[i]);
      words[i] = noNew(words[i]);

      //check for any new blank spaces designating new words, split them off and push back into our words array
      var wordarr = words[i].split(' ');
      if (wordarr.length > 1){
        for (var j = 1; j<wordarr.length; j++){
          words.push(wordarr[j]);
        } 
        words[i] = wordarr[0];
      }
      //final filter for words with non-standard characters
      //using the word as a hash-key, its value is the number of 
      //occurrences of the key-word in each document
      if (words[i] in returnObj.wordtable) {
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
};

module.exports.readdir = function (fromSource, theFilter) {
  if (!fromSource) {throw 'readdirFilter source is not specified';}

  // // future TODO, check input
  // // if the theFilter is defined, but not string, function, or an array, it's the wrong format

  // // future TODO, multiples ways to filter
  // now that the input has been checked, read the directory and use ext, regexp, or filter functions
  return fs.readdirAsync(fromSource)
    .then(function (result) {
      var results = [];
      // filter is a string of .ext name, NOT regex
      if (typeof theFilter === 'string') {
        for (var i = 0; i < result.length; i++) {
          var filename = result[i];
          if (filterString(filename, theFilter)) {
            results.push(filename);
          }
        }
      }
      return Promise.resolve(results);
    }
  );

};


var commonWords = {
  the:null,
  be:null,
  to:null,
  of:null,
  and:null,
  a:null,
  in:null,
  that:null,
  have:null,
  I:null,
  it:null,
  for:null,
  not:null,
  on:null,
  with:null,
  he:null,
  as:null,
  you:null,
  do:null,
  at:null,
  Word:null,
  this:null,
  but:null,
  his:null,
  by:null,
  from:null,
  they:null,
  we:null,
  say:null,
  her:null,
  she:null,
  or:null,
  an:null,
  will:null,
  my:null,
  one:null,
  all:null,
  would:null,
  there:null,
  their:null,
  what:null,
  so:null,
  up:null,
  out:null,
  if:null,
  about:null,
  who:null,
  get:null,
  which:null,
  go:null,
  me:null,
  when:null,
  make:null,
  can:null,
  like:null,
  time:null,
  no:null,
  just:null,
  him:null,
  know:null,
  take:null,
  people:null,
  into:null,
  year:null,
  your:null,
  good:null,
  some:null,
  could:null,
  them:null,
  see:null,
  other:null,
  than:null,
  then:null,
  now:null,
  look:null,
  only:null,
  come:null,
  its:null,
  over:null,
  think:null,
  also:null,
  back:null,
  after:null,
  use:null,
  two:null,
  how:null,
  our:null,
  work:null,
  first:null,
  well:null,
  way:null,
  even:null,
  new:null,
  want:null,
  because:null 
};
