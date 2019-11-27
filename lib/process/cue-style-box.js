var StyleBox = require('./style-box.js');
var determineBidi = require('./determine-bidi.js');
var parseContent = require('./parse-content.js');

// Constructs the computed display state of the cue (a div). Places the div
// into the overlay which should be a block level element (usually a div).
function CueStyleBox(window, cue, styleOptions) {
  StyleBox.call(this);
  this.cue = cue;

  // Parse our cue's text into a DOM tree rooted at 'cueDiv'. This div will
  // have inline positioning and will function as the cue background box.
  this.cueDiv = parseContent(window, cue.text);
  var styles = {
    color: "rgba(255, 255, 255, 1)",
    backgroundColor:  "rgba(0, 0, 0, 0.8)",
    position: "relative",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "inline",
    writingMode: cue.vertical === "" ? "horizontal-tb"
                                     : cue.vertical === "lr" ? "vertical-lr"
                                                             : "vertical-rl",
    unicodeBidi: "plaintext"
  };

  this.applyStyles(styles, this.cueDiv);

  // Create an absolutely positioned div that will be used to position the cue
  // div. Note, all WebVTT cue-setting alignments are equivalent to the CSS
  // mirrors of them except middle instead of center on Safari.
  this.div = window.document.createElement("div");
  styles = {
    direction: determineBidi(this.cueDiv),
    writingMode: cue.vertical === "" ? "horizontal-tb"
                                     : cue.vertical === "lr" ? "vertical-lr"
                                                             : "vertical-rl",
    unicodeBidi: "plaintext",
    textAlign: cue.align === "middle" ? "center" : cue.align,
    font: styleOptions.font,
    whiteSpace: "pre-line",
    position: "absolute"
  };

  this.applyStyles(styles);
  this.div.appendChild(this.cueDiv);

  // Calculate the distance from the reference edge of the viewport to the text
  // position of the cue box. The reference edge will be resolved later when
  // the box orientation styles are applied.
  var textPos = 0;
  switch (cue.positionAlign) {
  case "start":
    textPos = cue.position;
    break;
  case "center":
    textPos = cue.position - (cue.size / 2);
    break;
  case "end":
    textPos = cue.position - cue.size;
    break;
  }

  // Horizontal box orientation; textPos is the distance from the left edge of the
  // area to the left edge of the box and cue.size is the distance extending to
  // the right from there.
  if (cue.vertical === "") {
    this.applyStyles({
      left:  this.formatStyle(textPos, "%"),
      width: this.formatStyle(cue.size, "%")
    });
  // Vertical box orientation; textPos is the distance from the top edge of the
  // area to the top edge of the box and cue.size is the height extending
  // downwards from there.
  } else {
    this.applyStyles({
      top: this.formatStyle(textPos, "%"),
      height: this.formatStyle(cue.size, "%")
    });
  }

  this.move = function(box) {
    this.applyStyles({
      top: this.formatStyle(box.top, "px"),
      bottom: this.formatStyle(box.bottom, "px"),
      left: this.formatStyle(box.left, "px"),
      right: this.formatStyle(box.right, "px"),
      height: this.formatStyle(box.height, "px"),
      width: this.formatStyle(box.width, "px")
    });
  };
}
CueStyleBox.prototype = Object.create(StyleBox.prototype);
CueStyleBox.prototype.constructor = CueStyleBox;

module.exports = CueStyleBox;
