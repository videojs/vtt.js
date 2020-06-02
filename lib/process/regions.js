var BoxPosition = require('./box-position.js');
var CUE_BACKGROUND_PADDING = "1.5%";

function setupRegions(regions, overlay) {
  regions = regions || [];

  for (var i = 0; i < regions.length; i++) {
    var region = regions[i];

    if (region.displayState && region.displayState.parentElement === overlay) {
      continue;
    }

    var display = region.displayState = window.document.createElement('div')
    var overlayHeight = overlay.offsetHeight;
    var height = Math.round(overlayHeight / 100) * 6 * region.lines;
    var width = region.width;
    display.classList.add(region.id);
    display.style.width = width + '%';
    display.style.height = height + 'px';
    display.style.position = "absolute";
    display.style.left = `calc(${region.viewportAnchorX}% - ${width * region.regionAnchorX / 100}%`;
    display.style.top = overlayHeight * region.viewportAnchorY / 100 - height * region.regionAnchorY / 100 + 'px';
    display.style.margin = CUE_BACKGROUND_PADDING;
    display.style.overflow = "hidden";


    var innerDisplay = window.document.createElement('div');
    innerDisplay.style.width = '100%';
    innerDisplay.style.height = 'auto';
    innerDisplay.style.position = "absolute";
    innerDisplay.style.bottom = 0;
    innerDisplay.style.transitionProperty = 'height';
    innerDisplay.style.transitionDuration = '0.433s';

    display.appendChild(innerDisplay);
    overlay.appendChild(display);
  }
}

function readdRegionCue(cue) {
  region.displayState.firstChild.appendChild(cue.displayState);
}

function handleRegionCue(cue, styleBox) {
  var regionDisplay = cue.region.displayState.firstChild;
  var rH = regionDisplay.offsetHeight;

  cue.region.displayState.firstChild.appendChild(styleBox.div);

  var cH = styleBox.div.offsetHeight;

  regionDisplay.style.height = rH+cH + 'px';
  var containerBox = BoxPosition.getSimpleBoxPosition(cue.region.displayState.firstChild);
  if (cue.region.scroll === 'up') {
    styleBox.div.style.top = 'auto';
    // for (var j = 0; j < cue.region.displayState.firstChild.children.length; j++) {
      // var c = cue.region.displayState.firstChild.children[j];
      // var top = parseInt(c.style.top, 10);
      // console.log(c.style.top, '!!1');
      // c.style.top = 'auto';// top - styleBox.div.offsetHeight + 'px';
      // console.log(c.style.top, '!!');
    // }
  }

  return containerBox;
}

function cueInRegion(cue) {
  return cue.region &&
    cue.displayState.parentElement === cue.region.displayState.firstChild;
}

module.exports = {
  setupRegions,
  readdRegionCue,
  handleRegionCue,
  cueInRegion
};
