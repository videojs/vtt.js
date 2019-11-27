var document = require('global/document');
var parseTimeStamp = require('../parser/parse-timestamp.js');

var TEXTAREA_ELEMENT = document.createElement("textarea");

var NEEDS_PARENT = {
  rt: "ruby"
};

var TAG_NAME = {
  c: "span",
  i: "i",
  b: "b",
  u: "u",
  ruby: "ruby",
  rt: "rt",
  v: "span",
  lang: "span"
};

var TAG_ANNOTATION = {
  v: "title",
  lang: "lang"
};

// 5.1 default text color
// 5.2 default text background color is equivalent to text color with bg_ prefix
var DEFAULT_COLOR_CLASS = {
  white: 'rgba(255,255,255,1)',
  lime: 'rgba(0,255,0,1)',
  cyan: 'rgba(0,255,255,1)',
  red: 'rgba(255,0,0,1)',
  yellow: 'rgba(255,255,0,1)',
  magenta: 'rgba(255,0,255,1)',
  blue: 'rgba(0,0,255,1)',
  black: 'rgba(0,0,0,1)'
};

// Parse content into a document fragment.
function parseContent(window, input) {
  function nextToken() {
    // Check for end-of-string.
    if (!input) {
      return null;
    }

    // Consume 'n' characters from the input.
    function consume(result) {
      input = input.substr(result.length);
      return result;
    }

    var m = input.match(/^([^<]*)(<[^>]*>?)?/);
    // If there is some text before the next tag, return it, otherwise return
    // the tag.
    return consume(m[1] ? m[1] : m[2]);
  }

  function unescape(s) {
    TEXTAREA_ELEMENT.innerHTML = s;
    s = TEXTAREA_ELEMENT.textContent;
    TEXTAREA_ELEMENT.textContent = "";
    return s;
  }

  function shouldAdd(current, element) {
    return !NEEDS_PARENT[element.localName] ||
           NEEDS_PARENT[element.localName] === current.localName;
  }

  // Create an element for this tag.
  function createElement(type, annotation) {
    var tagName = TAG_NAME[type];
    if (!tagName) {
      return null;
    }
    var element = window.document.createElement(tagName);
    var name = TAG_ANNOTATION[type];
    if (name && annotation) {
      element[name] = annotation.trim();
    }
    return element;
  }

  var rootDiv = window.document.createElement("div"),
      current = rootDiv,
      t,
      tagStack = [];

  while ((t = nextToken()) !== null) {
    if (t[0] === '<') {
      if (t[1] === "/") {
        // If the closing tag matches, move back up to the parent node.
        if (tagStack.length &&
            tagStack[tagStack.length - 1] === t.substr(2).replace(">", "")) {
          tagStack.pop();
          current = current.parentNode;
        }
        // Otherwise just ignore the end tag.
        continue;
      }
      var ts = parseTimeStamp(t.substr(1, t.length - 2));
      var node;
      if (ts) {
        // Timestamps are lead nodes as well.
        node = window.document.createProcessingInstruction("timestamp", ts);
        current.appendChild(node);
        continue;
      }
      var m = t.match(/^<([^.\s/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);
      // If we can't parse the tag, skip to the next tag.
      if (!m) {
        continue;
      }
      // Try to construct an element, and ignore the tag if we couldn't.
      node = createElement(m[1], m[3]);
      if (!node) {
        continue;
      }
      // Determine if the tag should be added based on the context of where it
      // is placed in the cuetext.
      if (!shouldAdd(current, node)) {
        continue;
      }
      // Set the class list (as a list of classes, separated by space).
      if (m[2]) {
        var classes = m[2].split('.');

        classes.forEach(function(cl) {
          var bgColor = /^bg_/.test(cl);
          // slice out `bg_` if it's a background color
          var colorName = bgColor ? cl.slice(3) : cl;

          if (Object.prototype.hasOwnProperty.call(DEFAULT_COLOR_CLASS, colorName)) {
            var propName = bgColor ? 'background-color' : 'color';
            var propValue = DEFAULT_COLOR_CLASS[colorName];

            node.style[propName] = propValue;
          }
        });

        node.className = classes.join(' ');
      }
      // Append the node to the current node, and enter the scope of the new
      // node.
      tagStack.push(m[1]);
      current.appendChild(node);
      current = node;
      continue;
    }

    // Text nodes are leaf nodes.
    current.appendChild(window.document.createTextNode(unescape(t)));
  }

  return rootDiv;
}

module.exports = parseContent;
