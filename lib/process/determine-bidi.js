var isStrongRTLChar = require('./is-strong-rtl-char.js');

function determineBidi(cueDiv) {
  var nodeStack = [],
      text = "",
      charCode;

  if (!cueDiv || !cueDiv.childNodes) {
    return "ltr";
  }

  function pushNodes(nodeStack, node) {
    for (var i = node.childNodes.length - 1; i >= 0; i--) {
      nodeStack.push(node.childNodes[i]);
    }
  }

  function nextTextNode(nodeStack) {
    if (!nodeStack || !nodeStack.length) {
      return null;
    }

    var node = nodeStack.pop(),
        text = node.textContent || node.innerText;
    if (text) {
      // TODO: This should match all unicode type B characters (paragraph
      // separator characters). See issue #115.
      var m = text.match(/^.*(\n|\r)/);
      if (m) {
        nodeStack.length = 0;
        return m[0];
      }
      return text;
    }
    if (node.tagName === "ruby") {
      return nextTextNode(nodeStack);
    }
    if (node.childNodes) {
      pushNodes(nodeStack, node);
      return nextTextNode(nodeStack);
    }
  }

  pushNodes(nodeStack, cueDiv);
  while ((text = nextTextNode(nodeStack))) {
    for (var i = 0; i < text.length; i++) {
      charCode = text.charCodeAt(i);
      if (isStrongRTLChar(charCode)) {
        return "rtl";
      }
    }
  }
  return "ltr";
}

module.exports = determineBidi;
