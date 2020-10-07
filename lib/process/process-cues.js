var BoxPosition = require('./box-position.js');
var CueStyleBox = require('./cue-style-box.js');
var moveBoxToLinePosition = require('./move-box-to-line-position.js');
var {
  setupRegions,
  readdRegionCue,
  removeRegionCue,
  handleRegionCue,
  cueInRegion
} = require('./regions.js');

var FONT_SIZE_PERCENT = 0.05;
var FONT_STYLE = "sans-serif";
var CUE_BACKGROUND_PADDING = "1.5%";

// Runs the processing model over the cues and regions passed to it.
// @param overlay A block level element (usually a div) that the computed cues
//                and regions will be placed into.
var processCues = function(window, cues, overlay, regions) {
  regions = regions || [];


  if (!window || !cues || !overlay) {
    return null;
  }

  function usingCues(cue) {
    return cue.region && regions.length > 0;
  }

  // setup region overlays
  setupRegions(regions, overlay);

  // setup main overlay
  var paddedOverlay = overlay.querySelector('.vttjs-padded-overlay');

  if (!paddedOverlay) {
    paddedOverlay = window.document.createElement("div");
    paddedOverlay.className = 'vttjs-padded-overlay'
    paddedOverlay.style.position = "absolute";
    paddedOverlay.style.left = "0";
    paddedOverlay.style.right = "0";
    paddedOverlay.style.top = "0";
    paddedOverlay.style.bottom = "0";
    paddedOverlay.style.margin = CUE_BACKGROUND_PADDING;
    overlay.appendChild(paddedOverlay);
  }


  // remove cues that aren't in the list of cues we were just given
  var cueEls = paddedOverlay.querySelectorAll('.vttjs-cue');
  clearOldCues(cueEls);

  if (regions.length === 0) {
    var regions = overlay.querySelectorAll('.vttjs-region');
  }

  for (var i = 0; i < regions.length; i++) {
    var region = regions[i];
    var regionDisplay = region.displayState ? region.displayState.firstChild : region.firstChild;
    var cueEls = regionDisplay.querySelectorAll('.vttjs-cue');
    var [height, removed] = clearOldCues(cueEls, cues, true);

    if (removed > 1) {
      regionDisplay.style.height = height + 'px';
    }
  };

  function clearOldCues(cueEls, cues) {
    cues = cues || [];

    var keptCuesHeight = 0;
    var removed = 0;

    for (var i = 0; i < cueEls.length; i++) {
      var el = cueEls[i];
      var keep = false;
      for (var j = 0; j < cues.length; j++) {
        var cue = cues[j];
        if (cue.displayState && el === cue.displayState) {
          keep = true;
          if (usingCues(cue)) {
            keptCuesHeight += cue.displayState.offsetHeight;
          }
          break;
        }
      }
      if (!keep) {
        if (el.parentElement.classList.contains('vttjs-region-display')) {
          removeRegionCue(el);
          removed++;
        } else {
          el.parentElement.removeChild(el);
        }
      }
    }

    return [keptCuesHeight, removed];
  }

  // Determine if we need to compute the display states of the cues. This could
  // be the case if a cue's state has been changed since the last computation or
  // if it has not been computed yet.
  function shouldCompute(cues) {
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].hasBeenReset || !cues[i].displayState) {
        return true;
      }
    }
    return false;
  }

  // We don't need to recompute the cues' display states. Just reuse them.
  if (!shouldCompute(cues)) {
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].region) {
        readdRegionCue(cues[i]);
      } else {
        paddedOverlay.appendChild(cues[i].displayState);
      }
    }
    return;
  }

  var boxPositions = [],
      regionBoxPositions = new Map(),
      containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay),
      fontSize = Math.round(containerBox.height * FONT_SIZE_PERCENT * 100) / 100;
  var styleOptions = {
    font: fontSize + "px " + FONT_STYLE
  };

  (function() {
    var styleBox, cue;
    var regionCueCounts = {};

    for (var i = 0; i < cues.length; i++) {
      cue = cues[i];
      // if cue is already displaying, we don't need to position it
      if (cue.displayState &&
          (cue.displayState.parentElement === paddedOverlay ||
           cueInRegion(cue))
      ) {
        continue;
      }

      // Compute the intial position and styles of the cue div.
      styleBox = new CueStyleBox(window, cue, styleOptions);

      if (usingCues(cue)) {
        if (!regionBoxPositions.has(cue.region)) {
          regionBoxPositions.set(cue.region, []);
        }

        let boxPositions = regionBoxPositions.get(cue.region);

        var regionId = cue.region.id;
        if (!(regionId in regionCueCounts)) {
          regionCueCounts[regionId] = -1;
        }

        handleRegionCue(cue, styleBox, regionCueCounts[regionId]++)

        boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));

        regionBoxPositions.set(cue.region, boxPositions);

      } else {
        paddedOverlay.appendChild(styleBox.div);

        // Move the cue div to it's correct line position.
        moveBoxToLinePosition(window, styleBox, containerBox, boxPositions);

        boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
      }

      // Remember the computed div so that we don't have to recompute it later
      // if we don't have too.
      cue.displayState = styleBox.div;
    }
  })();
};

module.exports = processCues;
