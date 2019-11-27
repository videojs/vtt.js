var BoxPosition = require('./box-position.js');
var computeLinePos = require('./compute-line-pos.js');

// Move a StyleBox to its specified, or next best, position. The containerBox
// is the box that contains the StyleBox, such as a div. boxPositions are
// a list of other boxes that the styleBox can't overlap with.
function moveBoxToLinePosition(window, styleBox, containerBox, boxPositions) {

  // Find the best position for a cue box, b, on the video. The axis parameter
  // is a list of axis, the order of which, it will move the box along. For example:
  // Passing ["+x", "-x"] will move the box first along the x axis in the positive
  // direction. If it doesn't find a good position for it there it will then move
  // it along the x axis in the negative direction.
  function findBestPosition(b, axis) {
    var bestPosition,
        specifiedPosition = new BoxPosition(b),
        percentage = 1; // Highest possible so the first thing we get is better.

    for (var i = 0; i < axis.length; i++) {
      while (b.overlapsOppositeAxis(containerBox, axis[i]) ||
             (b.within(containerBox) && b.overlapsAny(boxPositions))) {
        b.move(axis[i]);
      }
      // We found a spot where we aren't overlapping anything. This is our
      // best position.
      if (b.within(containerBox)) {
        return b;
      }
      var p = b.intersectPercentage(containerBox);
      // If we're outside the container box less then we were on our last try
      // then remember this position as the best position.
      if (percentage > p) {
        bestPosition = new BoxPosition(b);
        percentage = p;
      }
      // Reset the box position to the specified position.
      b = new BoxPosition(specifiedPosition);
    }
    return bestPosition || specifiedPosition;
  }

  var boxPosition = new BoxPosition(styleBox),
      cue = styleBox.cue,
      linePos = computeLinePos(cue),
      axis = [];

  // If we have a line number to align the cue to.
  if (cue.snapToLines) {
    var size;
    switch (cue.vertical) {
    case "":
      axis = [ "+y", "-y" ];
      size = "height";
      break;
    case "rl":
      axis = [ "+x", "-x" ];
      size = "width";
      break;
    case "lr":
      axis = [ "-x", "+x" ];
      size = "width";
      break;
    }

    var step = boxPosition.lineHeight,
        position = step * Math.round(linePos),
        maxPosition = containerBox[size] + step,
        initialAxis = axis[0];

    // If the specified intial position is greater then the max position then
    // clamp the box to the amount of steps it would take for the box to
    // reach the max position.
    if (Math.abs(position) > maxPosition) {
      position = position < 0 ? -1 : 1;
      position *= Math.ceil(maxPosition / step) * step;
    }

    // If computed line position returns negative then line numbers are
    // relative to the bottom of the video instead of the top. Therefore, we
    // need to increase our initial position by the length or width of the
    // video, depending on the writing direction, and reverse our axis directions.
    if (linePos < 0) {
      position += cue.vertical === "" ? containerBox.height : containerBox.width;
      axis = axis.reverse();
    }

    // Move the box to the specified position. This may not be its best
    // position.
    boxPosition.move(initialAxis, position);

  } else {
    // If we have a percentage line value for the cue.
    var calculatedPercentage = (boxPosition.lineHeight / containerBox.height) * 100;

    switch (cue.lineAlign) {
    case "center":
      linePos -= (calculatedPercentage / 2);
      break;
    case "end":
      linePos -= calculatedPercentage;
      break;
    }

    // Apply initial line position to the cue box.
    switch (cue.vertical) {
    case "":
      styleBox.applyStyles({
        top: styleBox.formatStyle(linePos, "%")
      });
      break;
    case "rl":
      styleBox.applyStyles({
        left: styleBox.formatStyle(linePos, "%")
      });
      break;
    case "lr":
      styleBox.applyStyles({
        right: styleBox.formatStyle(linePos, "%")
      });
      break;
    }

    axis = [ "+y", "-x", "+x", "-y" ];

    // Get the box position again after we've applied the specified positioning
    // to it.
    boxPosition = new BoxPosition(styleBox);
  }

  var bestPosition = findBestPosition(boxPosition, axis);
  styleBox.move(bestPosition.toCSSCompatValues(containerBox));
}

module.exports = moveBoxToLinePosition;
