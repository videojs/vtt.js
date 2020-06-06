function StyleBox() {
}

// Apply styles to a div. If there is no div passed then it defaults to the
// div on 'this'.
StyleBox.prototype.applyStyles = function(styles, div) {
  div = div || this.div;
  for (var prop in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, prop)) {
      div.style[prop] = styles[prop];
    }
  }
};

StyleBox.prototype.formatStyle = function(val, unit) {
  return val === 0 ? 0 : val + unit;
};

module.exports = StyleBox;
