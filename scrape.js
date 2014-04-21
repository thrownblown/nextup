/*

  LOGIC: 

  If readability is sucessful
    - update mongo
      if successful
        create wordtable and save as .json
        remove from queue

  Add to scrape queue IF
    not in scrapeQueue AND not in mongoMaster
*/

var common = { through:null,since:null,such:null,much:null,was:null,is:null,are:null,has:null,the:null,be:null,to:null,of:null,and:null,a:null,in:null,that:null,have:null,I:null,it:null,for:null,not:null,on:null,with:null,he:null,as:null,you:null,do:null,at:null,Word:null,this:null,but:null,his:null,by:null,from:null,they:null,we:null,say:null,her:null,she:null,or:null,an:null,will:null,my:null,one:null,all:null,would:null,there:null,their:null,what:null,so:null,up:null,out:null,if:null,about:null,who:null,get:null,which:null,go:null,me:null,when:null,make:null,can:null,like:null,time:null,no:null,just:null,him:null,know:null,take:null,people:null,into:null,year:null,your:null,good:null,some:null,could:null,them:null,see:null,other:null,than:null,then:null,now:null,look:null,only:null,come:null,its:null,over:null,think:null,also:null,back:null,after:null,use:null,two:null,how:null,our:null,work:null,first:null,well:null,way:null,even:null,new:null,want:null,because:null };
var FeedParser = require('feedparser');
var request = require('request');
var Promise = require('bluebird');
var Sanitizer = require('sanitizer');
var cheerio = require('cheerio');
var CronJob = require('cron').CronJob;
var mongoose = require('mongoose');

var rssQ = require('./rssQueue.js');
var myFs = require('./fsFunctions.js');
var fs = require('fs');

var rssURL = "https://news.ycombinator.com/rss";

var Schema = mongoose.Schema;
var db = mongoose.connection;
var mongoURL = process.env.MONGO || "mongodb://localhost/db";
mongoose.connect(mongoURL);

// greg
var api = '932008a00a8def147f99692f0eb8110fe77a6f42';

// // alex
// var api = '9695482fe1197a0ba40b18c71190d2669b7d903a';

var siteSchema = new Schema({
  content: String,
  domain: String,
  author: String,
  url: String,
  short_url: String,
  title: String,
  excerpt: String,
  direction: String,
  word_count: Number,
  total_pages: Number,
  date_published: Date,
  dek: String,
  lead_image_url: String,
  next_page_id: Number,
  rendered_pages: Number,
  file: String
});

var Site = mongoose.model('Site', siteSchema);

// master lists
var masterRssList = {};
var scrapeQueue = rssQ.makeScrapeQueue();

/***
 *       _____                    
 *      / ____|                   
 *     | |      _ __  ___   _ __  
 *     | |     | '__|/ _ \ | '_ \ 
 *     | |____ | |  | (_) || | | |
 *      \_____||_|   \___/ |_| |_|
 *                                
 *                                
 */

var readabilityRequestCron = function (time, master) {
  master = master || masterRssList;
  var time = time || '*/20 * * * * *';
  new CronJob(time, function(){
  console.log('You will see this message every 20 sec');

  // populates the master rss queue which is independent of querying readability,
  /*  
    Add to scrape queue IF
     not in scrapeQueue AND not in mongoMaster
  */
  populateMasterRssQueue(rssURL);

  
  /*
    If queryReadability is sucessful
    - updates mongo
      if successful
        creates wordtable and save as .json
        removes from queue
  */
  queryReadability();

  }, null, true, "America/Los_Angeles");
};

// populates rss master list upon successful rss read
var populateMasterRssQueue = function (url, limit) {
  url = url || rssURL;
  var archive = fs.readdirSync('./scrapeArchive/');
  var main = fs.readdirSync('./json/');

  rssReader(url).then(function(rssResults){

    console.log('rss scrape results: ', toRssResultTitles(rssResults));

    // var addedNew = false;

    var len = limit ? limit : rssResults.length;

    // check each item from the rss result and add to the queue IF
    //   1. it's not contained in scrapeQueue
    //   2. it's not in the mongoDB TODO (add add inside mongoDBQuery)
    for (var i = 0; i < len; i++) {
      var rssObj = rssResults[i];
      if (isRssDocValid(rssObj) && !scrapeQueue.contains(rssObj)) {
          var filename = myFs.toFilename(rssObj);
          if (archive.indexOf(filename + '.json') === -1 && main.indexOf(filename + '.json') === -1) {
            scrapeQueue.queue(rssObj);
          }
      }
      // if (isRssDocValid(rssObj) && !scrapeQueue.contains(rssObj)) {
      //   mongoCheck(rssObj).then(function (isInMongo) {
      //     console.log('inside rss queue isInMongo: ', isInMongo, rssObj.title);
      //     if (!isInMongo) {
      //       var add = scrapeQueue.queue(rssObj);
      //       console.log('added to scrapeQueue: ', add);
      //       // addedNew = true;
      //     }
      //   }).catch(function (err) {
      //     console.log('mongoCheck query errored: ', err);
      //   });
      // }
    }
    // for testing purposes
    // if (addedNew) {
    //   console.log('\ncurrent rss list: \n', scrapeQueue.all());
    // }
  })
  .catch(function(err){
    console.log('rssReader did not read rss: ', err);
  });
};

// calls readability function which queries the readability api and returns a parsed object to be passed to wordTableMaker
/*
TODO PLAN
  IF queryReadability is successful
    - Update mongoDB
      IF mongoDB update is successful
        0. create a wordTable and save as .json
        1. remove from Queue
*/

var queryReadability = function () {

  if (scrapeQueue.size() > 0) {
    // firstInQueue = scrapeQueue.all()[0];
    var d = scrapeQueue.dequeue();
    console.log('dequeued: ', d.title);
    console.log('next que: ', scrapeQueue.all()[0])

    // if (isRssDocValid(firstInQueue)) {
      if (isRssDocValid(d)) {
      // readableQuery(firstInQueue.link)
      readableQuery(d.link)
      .then(function (doc) {
        console.log('readableQuery worked: ', doc.title);

        myFs.saveAsJson(doc)
        .then(function(item){
          console.log('save as Json successful');
        })
        .catch(function (err) {
          console.log('save as json did not work: ', err);
        });
      })
      .catch(function(err){
        console.log('reability did not work: ', err);
      });
    }
  }
};

/***
 *      _    _        _                    
 *     | |  | |      | |                   
 *     | |__| |  ___ | | _ __    ___  _ __ 
 *     |  __  | / _ \| || '_ \  / _ \| '__|
 *     | |  | ||  __/| || |_) ||  __/| |   
 *     |_|  |_| \___||_|| .__/  \___||_|   
 *                      | |                
 *                      |_|                
 */

// returns an array of rss objects converted to an array of rss titles
var toRssResultTitles = function (master) {
  master = master || masterRssList;
  var titles = [];
  for (var i = 0; i < master.length; i++) {
    titles.push(master[i].title);
  }
  return titles;
};

// checks if the rss document is in the rss master
var isInRssMaster = function (doc, master) {
  if (!isRssDocValid(doc)) {
    console.log('doc itself, or title, or link is undefined: ', doc.title);
    return false;
  }
  master = master || masterRssList;
  if (master[doc.title] !== undefined) {
    return true;
  }
  return false;
};

var isRssDocValid = function (doc) {
  if (!doc) { console.log ('rss doc not valid!!!', doc)}
  if (typeof doc.title !== 'string' && typeof doc.link !== 'string') {
    return false;
  } 
  return true;
};

// 
var addToMaster = function (doc) {
  if (!doc) { throw "addToMaster input is undefined"}
  // only adds to master Rss list if it's not in the master rss list
  if (isRssDocValid(doc) && master[doc.title] === undefined) {
    master[doc.title] = {};
    master[doc.title].link = doc.link;
    master[doc.title].title = doc.title;

    return master[doc.title];
  } else {
    console.log('rss doc is repeat and not added: ', doc.title);
    return false;
  }
};

// returns an array of titles from the master rss list
var currentMasterRssQueue = function (master) {
  master = master || masterRssList;
  var results = [];
  for (var item in master) {
    results.push(item.title);
  }
  return results;
};



/***
 *       ____                      _            
 *      / __ \                    (_)           
 *     | |  | | _   _   ___  _ __  _   ___  ___ 
 *     | |  | || | | | / _ \| '__|| | / _ \/ __|
 *     | |__| || |_| ||  __/| |   | ||  __/\__ \
 *      \___\_\ \__,_| \___||_|   |_| \___||___/
 *                                              
 *                                              
 */

// Makes a request to rss url and returns a promised array of rss objects
var rssReader = function(url) {
  return new Promise(function(resolve, reject){
    var req = request(url);
    var rssResult = [];
    var feedparser = new FeedParser();
    req.on('error', function (error) {
      reject(error);
    });
    req.on('response', function (res) {
      var stream = this;
      if (res.statusCode !== 200) return this.emit('error', new Error('Bad status code'));
      stream.pipe(feedparser);
    });

    feedparser.on('error', function(error) {
      reject(error);
    });
    feedparser.on('readable', function() {
      var stream = this;
      var meta = this.meta;
      var item;

      while (item = stream.read()) {
        rssResult.push(item);
      }
      resolve(rssResult);
    });
  });
};

var readableQuery = function(url) {
  var doc = {};
  var apiKey = process.env.API || api;
  return new Promise (function(resolve, reject) {
    var rURL = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
    request(rURL, function(error, response, html) {
      if(!error && response.statusCode === 200) {
        readable = JSON.parse(html);
        mongoCheck(readable).then(function (isInMongo) {
          if (!isInMongo) {
            return saveToMongo(readable)
            .then(function() {
              doc.title = readable.title;
              doc.url = readable.url;
              doc.content = readable.content;
              console.log('saved to mongo: ', doc.title);
              return wordTableMaker(doc)
                .then(function(docWithWordTable) {
                  return resolve(docWithWordTable);
                });
            });
          }
        }).catch(function (err) {
          console.log('mongo check error: ', err);
        });
      } else {
        reject(error);
      }
    });
  });
};


var saveToMongo = function(obj) {
  return new Promise (function(resolve, reject) {
    var site = new Site(obj);
      site.save(function(error, result){
      if (error) {
        reject(err);
      }
      resolve(obj);
    });
  });
};

var wordTableMaker = function(doc) {
  return new Promise(function(resolve, reject) {
    var result = {};
    result.title = doc.title;
    result.link = doc.url;
    result.wordtable = {};
    doc.content = Sanitizer.sanitize(doc.content);
    doc.content = doc.content.replace(/<\/?[^>]+(>|$)/g, "");
    doc.content = doc.content.replace(/[^\w\s]/gi, '');
    var words = doc.content.split(" ");
    for (var j = 0; j < words.length; j++) {
      word = words[j];
      words[j] = word.replace(/[\n\t]/g, '').toLowerCase();
    }
    // console.log(words);
    for (var i = 0; i < words.length; i++) {
      if (common[words[i]] !== null && words[i] !== '' && words[i].length > 2) {
        if (result.wordtable[words[i]] === undefined) {
          result.wordtable[words[i]] = 0;
        }
        result.wordtable[words[i]] += 1;
      }
    }
    result.wordunique = Object.keys(result.wordtable).length;
    resolve(result);
  });
};

var mongoCheck = function(rssObj) {

  return new Promise(function(resolve, reject) {
    var url = (rssObj.url !== undefined )? rssObj.url : rssObj.link;
    var title = rssObj.title;

    var mongoQuery = { title: title , url: url};
    Site.find(mongoQuery).exec(function(error, result) {
      // console.log('mongoose results: ' ,result);
      if (error) {
        reject(error);
      }
      if (result.length === 0) {
        console.log('not in mongo: ', mongoQuery);
        resolve(false);
      } else {
        console.log('is in mongo: ', mongoQuery);
        resolve(true);
      }
    });
  });
};

readSiteByUrl = function(url){
  return new Promise (function(resolve, reject) {
    var requrl = 'https://readability.com/api/content/v1/parser?url=' + url + '&token=' + apiKey;
    console.log(requrl);
    request(requrl, function (error, response, html) {
      if (!error && response.statusCode === 200) {
        var readJSON = JSON.parse(html);
        var site = new Site(readJSON);
        site.save(function(err, result){
          if (err) {
            reject(err);
          }
          console.log('saved to db ' + readJSON);
          resolve(readJSON);
        });
      }
    });
  });
};

/***
 *      ______                            _   
 *     |  ____|                          | |  
 *     | |__   __  __ _ __    ___   _ __ | |_ 
 *     |  __|  \ \/ /| '_ \  / _ \ | '__|| __|
 *     | |____  >  < | |_) || (_) || |   | |_ 
 *     |______|/_/\_\| .__/  \___/ |_|    \__|
 *                   | |                      
 *                   |_|                      
 */

module.exports.readabilityRequestCron = readabilityRequestCron;
module.exports.readSiteByUrl = readSiteByUrl;
module.exports.Site = Site;



/***
 *       _____              _         _   
 *      / ____|            (_)       | |  
 *     | (___    ___  _ __  _  _ __  | |_ 
 *      \___ \  / __|| '__|| || '_ \ | __|
 *      ____) || (__ | |   | || |_) || |_ 
 *     |_____/  \___||_|   |_|| .__/  \__|
 *                            | |         
 *                            |_|         
 */
