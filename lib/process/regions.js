var BoxPosition = require('./box-position.js');
var CUE_BACKGROUND_PADDING = "1.5%";

function setupRegions(regions, overlay) {
  regions = regions || [];

  for (var i = 0; i < regions.length; i++) {
    var region = regions[i];

    if (region.displayState && region.displayState.parentElement === overlay) {
      var overlayHeight = overlay.offsetHeight;
      var height = Math.round(overlayHeight / 100) * 6 * region.lines;
      var newTop = overlayHeight * region.viewportAnchorY / 100 - height * region.regionAnchorY / 100 + 'px';
      if (region.displayState.style.top !== newTop) {
        region.displayState.style.top = newTop;
      }
      continue;
    }

    var display = region.displayState = window.document.createElement('div')
    var overlayHeight = overlay.offsetHeight;
    var height = Math.round(overlayHeight / 100) * 6 * region.lines;
    var width = region.width;
    display.classList.add(region.id, 'vttjs-region');
    display.style.width = width + '%';
    display.style.height = height + 'px';
    display.style.position = "absolute";
    display.style.left = `calc(${region.viewportAnchorX}% - ${width * region.regionAnchorX / 100}%`;
    display.style.top = overlayHeight * region.viewportAnchorY / 100 - height * region.regionAnchorY / 100 + 'px';
    display.style.margin = CUE_BACKGROUND_PADDING;
    display.style.overflow = "hidden";


    var innerDisplay = window.document.createElement('div');
    innerDisplay.classList.add('vttjs-region-display');
    innerDisplay.style.width = '100%';
    innerDisplay.style.height = '0px';
    innerDisplay.style.position = "absolute";
    innerDisplay.style.bottom = 0;

    if (region.scroll === 'up') {
      innerDisplay.style.transitionProperty = 'height';
      innerDisplay.style.transitionDuration = '0.433s';
    }

    display.appendChild(innerDisplay);
    overlay.appendChild(display);
  }
}

function readdRegionCue(cue) {
  cue.region.displayState.firstChild.appendChild(cue.displayState);
  cue.region.displayState.firstChild.style.height = 'auto';
}

function removeRegionCue(el) {
  var regionDisplay = el.parentElement;
  var rH = parseInt(regionDisplay.style.height, 10);
  var cH = el.offsetHeight;

  regionDisplay.removeChild(el);

  var rH = regionDisplay.offsetHeight;
  regionDisplay.style.height = rH - cH + 'px';

  return cH;
}

function handleRegionCue(cue, styleBox, adjust) {
  var regionDisplay = cue.region.displayState && cue.region.displayState.firstChild;
  if (!regionDisplay) {
    return;
  }
  var rH = parseInt(regionDisplay.style.height, 10);

  regionDisplay.appendChild(styleBox.div);

  var cH = styleBox.div.offsetHeight;
  regionDisplay.style.height = rH+cH + 'px';
}

function cueInRegion(cue) {
  return cue.region &&
    cue.region.displayState &&
    cue.displayState.parentElement === cue.region.displayState.firstChild;
}

module.exports = {
  setupRegions,
  readdRegionCue,
  removeRegionCue,
  handleRegionCue,
  cueInRegion
};
