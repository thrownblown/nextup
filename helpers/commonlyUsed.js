// log results, give a title
var consoleStart = function (data, title) {
  console.log("\n\n");
  console.log("********** BEGIN " + title + " **********" + "\n\n");
  console.log(data);
  console.log("\n\n********** END " + title + " **********");
  console.log("\n\n");
};

module.exports.consoleStart = consoleStart;