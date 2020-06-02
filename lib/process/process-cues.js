var BoxPosition = require('./box-position.js');
var CueStyleBox = require('./cue-style-box.js');
var moveBoxToLinePosition = require('./move-box-to-line-position.js');
var {
  setupRegions,
  readdRegionCue,
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
  if (!window || !cues || !overlay) {
    return null;
  }

  var cueEls = overlay.querySelectorAll('.vttjs-cue');
  for (var i = 0; i < cueEls.length; i++) {
    var el = cueEls[i];
    var keep = false;
    for (var j = 0; j < cues.length; j++) {
      var cue = cues[j];
      if (cue.displayState && el === cue.displayState) {
        keep = true;
      }
    }
    if (!keep) {
      el.parentElement.removeChild(el);
    }
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
      containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay),
      fontSize = Math.round(containerBox.height * FONT_SIZE_PERCENT * 100) / 100;
  var styleOptions = {
    font: fontSize + "px " + FONT_STYLE
  };

  (function() {
    var styleBox, cue;

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

      if (cue.region) {
        containerBox = handleRegionCue(cue, styleBox)
      } else {
        paddedOverlay.appendChild(styleBox.div);
      }

      // Move the cue div to it's correct line position.
      moveBoxToLinePosition(window, styleBox, containerBox, boxPositions, cue.region);

      // Remember the computed div so that we don't have to recompute it later
      // if we don't have too.
      cue.displayState = styleBox.div;

      boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
    }
  })();
};

module.exports = processCues;
