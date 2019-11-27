// Represents the co-ordinates of an Element in a way that we can easily
// compute things with such as if it overlaps or intersects with another Element.
// Can initialize it with either a StyleBox or another BoxPosition.
function BoxPosition(obj) {
  // Either a BoxPosition was passed in and we need to copy it, or a StyleBox
  // was passed in and we need to copy the results of 'getBoundingClientRect'
  // as the object returned is readonly. All co-ordinate values are in reference
  // to the viewport origin (top left).
  var lh, height, width, top;
  if (obj.div) {
    height = obj.div.offsetHeight;
    width = obj.div.offsetWidth;
    top = obj.div.offsetTop;

    var rects = (rects = obj.div.childNodes) && (rects = rects[0]) &&
                rects.getClientRects && rects.getClientRects();
    obj = obj.div.getBoundingClientRect();
    // In certain cases the outter div will be slightly larger then the sum of
    // the inner div's lines. This could be due to bold text, etc, on some platforms.
    // In this case we should get the average line height and use that. This will
    // result in the desired behaviour.
    lh = rects ? Math.max((rects[0] && rects[0].height) || 0, obj.height / rects.length)
               : 0;

  }
  this.left = obj.left;
  this.right = obj.right;
  this.top = obj.top || top;
  this.height = obj.height || height;
  this.bottom = obj.bottom || (top + (obj.height || height));
  this.width = obj.width || width;
  this.lineHeight = lh !== undefined ? lh : obj.lineHeight;
}

// Move the box along a particular axis. Optionally pass in an amount to move
// the box. If no amount is passed then the default is the line height of the
// box.
BoxPosition.prototype.move = function(axis, toMove) {
  toMove = toMove !== undefined ? toMove : this.lineHeight;
  switch (axis) {
  case "+x":
    this.left += toMove;
    this.right += toMove;
    break;
  case "-x":
    this.left -= toMove;
    this.right -= toMove;
    break;
  case "+y":
    this.top += toMove;
    this.bottom += toMove;
    break;
  case "-y":
    this.top -= toMove;
    this.bottom -= toMove;
    break;
  }
};

// Check if this box overlaps another box, b2.
BoxPosition.prototype.overlaps = function(b2) {
  return this.left < b2.right &&
         this.right > b2.left &&
         this.top < b2.bottom &&
         this.bottom > b2.top;
};

// Check if this box overlaps any other boxes in boxes.
BoxPosition.prototype.overlapsAny = function(boxes) {
  for (var i = 0; i < boxes.length; i++) {
    if (this.overlaps(boxes[i])) {
      return true;
    }
  }
  return false;
};

// Check if this box is within another box.
BoxPosition.prototype.within = function(container) {
  return this.top >= container.top &&
         this.bottom <= container.bottom &&
         this.left >= container.left &&
         this.right <= container.right;
};

// Check if this box is entirely within the container or it is overlapping
// on the edge opposite of the axis direction passed. For example, if "+x" is
// passed and the box is overlapping on the left edge of the container, then
// return true.
BoxPosition.prototype.overlapsOppositeAxis = function(container, axis) {
  switch (axis) {
  case "+x":
    return this.left < container.left;
  case "-x":
    return this.right > container.right;
  case "+y":
    return this.top < container.top;
  case "-y":
    return this.bottom > container.bottom;
  }
};

// Find the percentage of the area that this box is overlapping with another
// box.
BoxPosition.prototype.intersectPercentage = function(b2) {
  var x = Math.max(0, Math.min(this.right, b2.right) - Math.max(this.left, b2.left)),
      y = Math.max(0, Math.min(this.bottom, b2.bottom) - Math.max(this.top, b2.top)),
      intersectArea = x * y;
  return intersectArea / (this.height * this.width);
};

// Convert the positions from this box to CSS compatible positions using
// the reference container's positions. This has to be done because this
// box's positions are in reference to the viewport origin, whereas, CSS
// values are in referecne to their respective edges.
BoxPosition.prototype.toCSSCompatValues = function(reference) {
  return {
    top: this.top - reference.top,
    bottom: reference.bottom - this.bottom,
    left: this.left - reference.left,
    right: reference.right - this.right,
    height: this.height,
    width: this.width
  };
};

// Get an object that represents the box's position without anything extra.
// Can pass a StyleBox, HTMLElement, or another BoxPositon.
BoxPosition.getSimpleBoxPosition = function(obj) {
  var height = obj.div ? obj.div.offsetHeight : obj.tagName ? obj.offsetHeight : 0;
  var width = obj.div ? obj.div.offsetWidth : obj.tagName ? obj.offsetWidth : 0;
  var top = obj.div ? obj.div.offsetTop : obj.tagName ? obj.offsetTop : 0;

  obj = obj.div ? obj.div.getBoundingClientRect() :
                obj.tagName ? obj.getBoundingClientRect() : obj;
  var ret = {
    left: obj.left,
    right: obj.right,
    top: obj.top || top,
    height: obj.height || height,
    bottom: obj.bottom || (top + (obj.height || height)),
    width: obj.width || width
  };
  return ret;
};

module.exports = BoxPosition;
