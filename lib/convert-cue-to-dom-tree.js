var parseContent = require('./process/parse-content.js');

var convertCueToDOMTree = function(window, cuetext) {
  if (!window || !cuetext) {
    return null;
  }
  return parseContent(window, cuetext);
};

module.exports = convertCueToDOMTree;
