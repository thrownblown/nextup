// creates a queue used to keep track of what is queued to be scraped by readability
/*
  functionality: 

  1. queue  : add to tail of queue
  2. dequeu: remove from head of queue
  3. head and tail pointer
  4. size
  5. contains

*/

// rssToScrapeQueue = Queue();

// linked list style
var makeScrapeQueue = function () {
  var queue = {};
  
  size = 0;
  head = null;
  tail = null;

  queue.size = function () {
    return size;
  }
  
  queue.queue = function (rssDoc) {
    var node = makeScrapeNode(rssDoc);
    if (head === null) {
      head = node;
    } else {
      tail.next = node;
    }

    tail = node;
    size++;
    // console.log('next queue: ', head.value);
    return node.value;
  };

  queue.dequeue = function () {
    if (head === null) {
      console.log('nothing to dequeue');
      return null;
    } else {
      var node = head;

      // if we're at the last node, then after we dequeue this node, the head and tail should both point to nothing again
      if (head === tail) {
        head = null;
        tail = null;

      } else {
        head = head.next
      }

      size--;
      return node.value;
    }
  };

  queue.contains = function (target) {
    node = head;
    while (node !== null) {
      if (node.value.title === target.title && node.value.link === target.link) {
        return true;
      } else {
        node = node.next;
      }
    }
    return false;
  };

  // returns an array of titles and links of everything inside the queue
  queue.all = function () {
    node = head;
    var list = []
    while (node) {
      list.push(node.value);
      node = node.next;
    }
    return list;
  }

  return queue;


};

var makeScrapeNode = function (rssObj) {
  var node = {}
  node.value = {};
  node.value.title = rssObj.title;
  node.value.link = rssObj.link;
  node.next = null;

  return node;
};

/***
 *      ______                            _        
 *     |  ____|                          | |       
 *     | |__   __  __ _ __    ___   _ __ | |_  ___ 
 *     |  __|  \ \/ /| '_ \  / _ \ | '__|| __|/ __|
 *     | |____  >  < | |_) || (_) || |   | |_ \__ \
 *     |______|/_/\_\| .__/  \___/ |_|    \__||___/
 *                   | |                           
 *                   |_|                           
 */

module.exports.makeScrapeQueue = makeScrapeQueue;

/***
 *      _______          _        
 *     |__   __|        | |       
 *        | |  ___  ___ | |_  ___ 
 *        | | / _ \/ __|| __|/ __|
 *        | ||  __/\__ \| |_ \__ \
 *        |_| \___||___/ \__||___/
 *                                
 *                                
 */
// // testing to see if queue works;

var executeTest = function () {
  t1 = {title: "hello", link: 'greg'};
  t2 = {title: 'world', link: 'lull'};
  t3 = {title: 'trees', link: 'halley'};

  var scrapeQueue = makeScrapeQueue();

  var r00 = scrapeQueue.dequeue() === null;
  var r01 = scrapeQueue.contains({title: 'hello' , link: 'greg'}) === false;

  scrapeQueue.queue(t1);
  scrapeQueue.queue(t2);

  var r02 = scrapeQueue.dequeue().title === t1.title;
  var r03 = scrapeQueue.dequeue().link === t2.link;
  var r04 = scrapeQueue.dequeue() === null;

  scrapeQueue.queue(t1);
  scrapeQueue.queue(t2);
  scrapeQueue.queue(t3);

  var r05 = scrapeQueue.contains(t1) === true;
  var r06 = scrapeQueue.contains(t2) === true;
  var r07 = scrapeQueue.contains(t3) === true;

  var list = scrapeQueue.all();

  //

  scrapeQueue = makeScrapeQueue();
  scrapeQueue.queue(t1);
  scrapeQueue.queue(t2);
  scrapeQueue.dequeue();
  scrapeQueue.queue(t3);

  var r08 = scrapeQueue.dequeue().title === t2.title;
  var r09 = scrapeQueue.all()[0].title === t3.title;
  var r10 = scrapeQueue.contains(t3) === true;
  var r11 = scrapeQueue.contains(t2) === false;


  console.log(r00, r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11);
  console.log('list: \n', list);
};

// executeTest();
