var ParsingError = require('./parsing-error.js');
var Settings = require('./settings.js');
var parseOptions = require('./parse-options.js');
var parseCue = require('./parse-cue.js');
var parseTimeStamp = require('./parse-timestamp.js');

var Parser = function(window, vttjs, decoder) {
  if (!decoder) {
    decoder = vttjs;
    vttjs = {};
  }
  if (!vttjs) {
    vttjs = {};
  }

  this.window = window;
  this.vttjs = vttjs;
  this.state = "INITIAL";
  this.buffer = "";
  this.decoder = decoder || new window.TextDecoder("utf8");
  this.regionList = [];
};

// If the error is a ParsingError then report it to the consumer if
// possible. If it's not a ParsingError then throw it like normal.
Parser.prototype.reportOrThrowError = function(e) {
  if (e instanceof ParsingError) {
    this.onparsingerror && this.onparsingerror(e);
  } else {
    throw e;
  }
};

Parser.prototype.parse = function (data, reuseCue) {
  var self = this;
  var reuseCue = reuseCue || false;

  // If there is no data then we won't decode it, but will just try to parse
  // whatever is in buffer already. This may occur in circumstances, for
  // example when flush() is called.
  if (data) {
    // Try to decode the data that we received.
    self.buffer += self.decoder.decode(data, {stream: true});
  }

  function collectNextLine() {
    var buffer = self.buffer;
    var pos = 0;
    while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
      ++pos;
    }
    var line = buffer.substr(0, pos);
    // Advance the buffer early in case we fail below.
    if (buffer[pos] === '\r') {
      ++pos;
    }
    if (buffer[pos] === '\n') {
      ++pos;
    }
    self.buffer = buffer.substr(pos);
    return line;
  }


  // draft-pantos-http-live-streaming-20
  // https://tools.ietf.org/html/draft-pantos-http-live-streaming-20#section-3.5
  // 3.5 WebVTT
  function parseTimestampMap(input) {
    var settings = new Settings();

    parseOptions(input, function(k, v) {
      switch(k) {
      case "MPEGT":
        settings.integer(k + 'S', v);
        break;
      case "LOCA":
        settings.set(k + 'L', parseTimeStamp(v));
        break;
      }
    }, /[^\d]:/, /,/);

    self.ontimestampmap && self.ontimestampmap({
      "MPEGTS": settings.get("MPEGTS"),
      "LOCAL": settings.get("LOCAL")
    });
  }

  // 3.2 WebVTT metadata header syntax
  function parseHeader(input) {
    if (input.match(/X-TIMESTAMP-MAP/)) {
      // This line contains HLS X-TIMESTAMP-MAP metadata
      parseOptions(input, function(k, v) {
        switch(k) {
        case "X-TIMESTAMP-MAP":
          parseTimestampMap(v);
          break;
        }
      }, /=/);
    }
  }

  // 5.1 WebVTT file parsing.
  try {
    var line;
    if (self.state === "INITIAL") {
      // We can't start parsing until we have the first line.
      if (!/\r\n|\n/.test(self.buffer)) {
        return this;
      }

      line = collectNextLine();

      var m = line.match(/^WEBVTT([ \t].*)?$/);
      if (!m || !m[0]) {
        throw new ParsingError(ParsingError.Errors.BadSignature);
      }

      self.state = "HEADER";
    }

    var alreadyCollectedLine = false;
    var sawCue = reuseCue;
    if (!reuseCue) {
      self.cue = null;
      self.regionSettings = null;
    }

    while (self.buffer) {
      // We can't parse a line until we have the full line.
      if (!/\r\n|\n/.test(self.buffer)) {
        return this;
      }

      if (!alreadyCollectedLine) {
        line = collectNextLine();
      } else {
        alreadyCollectedLine = false;
      }

      switch (self.state) {
      case "HEADER":
        // 13-18 - Allow a header (metadata) under the WEBVTT line.
        if (/:/.test(line)) {
          parseHeader(line);
        } else if (!line) {
          // An empty line terminates the header and blocks section.
          self.state = "BLOCKS";
        }
        continue;
      case "REGION":
        if (!line) {
          // create the region
          var region = new (self.vttjs.VTTRegion || self.window.VTTRegion)();
          region.id = self.regionSettings.get('id', "");
          region.width = self.regionSettings.get("width", 100);
          region.lines = self.regionSettings.get("lines", 3);
          region.regionAnchorX = self.regionSettings.get("regionanchorX", 0);
          region.regionAnchorY = self.regionSettings.get("regionanchorY", 100);
          region.viewportAnchorX = self.regionSettings.get("viewportanchorX", 0);
          region.viewportAnchorY = self.regionSettings.get("viewportanchorY", 100);
          region.scroll = self.regionSettings.get("scroll", "");
          // Register the region.
          self.onregion && self.onregion(region);
          // Remember the VTTRegion for later in case we parse any VTTCues that reference it.
          self.regionList.push({
            id: region.id,
            region: region
          });
          // An empty line terminates the REGION block
          self.regionSettings = null;
          self.state = "BLOCKS";
          break;
        }

        // if it's a new region block, create a new VTTRegion
        if (self.regionSettings === null) {
          self.regionSettings = new Settings();
        }

        // parse region options and set it as appropriate on the region
        parseOptions(line, function (k, v) {
          switch (k) {
          case "id":
            self.regionSettings.set(k, v);
            break;
          case "width":
            self.regionSettings.percent(k, v);
            break;
          case "lines":
            self.regionSettings.integer(k, v);
            break;
          case "regionanchor":
          case "viewportanchor":
            var xy = v.split(',');
            if (xy.length !== 2) {
              break;
            }
            // We have to make sure both x and y parse, so use a temporary
            // settings object here.
            var anchor = new Settings();
            anchor.percent("x", xy[0]);
            anchor.percent("y", xy[1]);
            if (!anchor.has("x") || !anchor.has("y")) {
              break;
            }
            self.regionSettings.set(k + "X", anchor.get("x"));
            self.regionSettings.set(k + "Y", anchor.get("y"));
            break;
          case "scroll":
            self.regionSettings.alt(k, v, ["up"]);
            break;
          }
        }, /:/, /\s/);

        continue;
      case "NOTE":
        // Ignore NOTE blocks.
        if (!line) {
          self.state = "ID";
        }
        continue;
      case "BLOCKS":
        if (!line) {
          continue;
        }

        // Check for the start of a NOTE blocks
        if (/^NOTE($[ \t])/.test(line)) {
          self.state = "NOTE";
          break;
        }

        // Check for the start of a REGION blocks
        if (/^REGION/.test(line) && !sawCue) {
          self.state = "REGION";
          break;
        }

        self.state = "ID";
        // Process line as an ID.
        /* falls through */
      case "ID":
        // Check for the start of NOTE blocks.
        if (/^NOTE($|[ \t])/.test(line)) {
          self.state = "NOTE";
          break;
        }
        // 19-29 - Allow any number of line terminators, then initialize new cue values.
        if (!line) {
          continue;
        }
        sawCue = true;
        self.cue = new (self.vttjs.VTTCue || self.window.VTTCue)(0, 0, "");
        // Safari still uses the old middle value and won't accept center
        try {
          self.cue.align = "center";
        } catch (e) {
          self.cue.align = "middle";
        }
        self.state = "CUE";
        // 30-39 - Check if self line contains an optional identifier or timing data.
        if (line.indexOf("-->") === -1) {
          self.cue.id = line;
          continue;
        }
        // Process line as start of a cue.
        /*falls through*/
      case "CUE":
        // 40 - Collect cue timings and settings.
        try {
          parseCue(line, self.cue, self.regionList);
        } catch (e) {
          self.reportOrThrowError(e);
          // In case of an error ignore rest of the cue.
          self.cue = null;
          self.state = "BADCUE";
          continue;
        }
        self.state = "CUETEXT";
        continue;
      case "CUETEXT":
        var hasSubstring = line.indexOf("-->") !== -1;
        // 34 - If we have an empty line then report the cue.
        // 35 - If we have the special substring '-->' then report the cue,
        // but do not collect the line as we need to process the current
        // one as a new cue.
        if (!line || hasSubstring && (alreadyCollectedLine = true)) {
          // We are done parsing self cue.
          self.oncue && self.oncue(self.cue);
          self.cue = null;
          self.state = "ID";
          continue;
        }
        if (self.cue.text) {
          self.cue.text += "\n";
        }
        self.cue.text += line.replace(/\u2028/g, '\n').replace(/u2029/g, '\n');
        continue;
      case "BADCUE": // BADCUE
        // 54-62 - Collect and discard the remaining cue.
        if (!line) {
          self.state = "ID";
        }
        continue;
      }
    }

    // if we ran out of buffer but we still have a cue, finish parsing it
    if (self.cue) {
      self.oncue && self.oncue(self.cue);
      self.cue = null;
      self.state = "ID";
    }
  } catch (e) {
    self.reportOrThrowError(e);

    // If we are currently parsing a cue, report what we have.
    if (self.state === "CUETEXT" && self.cue && self.oncue) {
      self.oncue(self.cue);
    }
    self.cue = null;
    self.regionSettings = null;
    // Enter BADWEBVTT state if header was not parsed correctly otherwise
    // another exception occurred so enter BADCUE state.
    self.state = self.state === "INITIAL" ? "BADWEBVTT" : "BADCUE";
  }
  return this;
};

Parser.prototype.flush = function () {
  var self = this;
  try {
    // Finish decoding the stream.
    self.buffer += self.decoder.decode();
    // Synthesize the end of the current cue or region.
    if (self.cue || self.state === "HEADER") {
      self.buffer += "\n\n";
      self.parse(null, true);
    }
    // If we've flushed, parsed, and we're still on the INITIAL state then
    // that means we don't have enough of the stream to parse the first
    // line.
    if (self.state === "INITIAL") {
      throw new ParsingError(ParsingError.Errors.BadSignature);
    }
  } catch(e) {
    self.reportOrThrowError(e);
  }
  self.onflush && self.onflush();
  return this;
};

module.exports = Parser;
