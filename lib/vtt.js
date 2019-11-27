/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

function getDefault(module) {
  return module.default || module;
}

function WebVTT() {
  // Nothing
}

// Helper to allow strings to be decoded instead of the default binary utf8 data.
WebVTT.StringDecoder = function() {
  return {
    decode: function(data) {
      if (!data) {
        return "";
      }
      if (typeof data !== "string") {
        throw new Error("Error - expected string data.");
      }
      return decodeURIComponent(encodeURIComponent(data));
    }
  };
};

WebVTT.convertCueToDOMTree = getDefault(require('./convert-cue-to-dom-tree.js'));

WebVTT.processCues = getDefault(require('./process/process-cues.js'));

WebVTT.Parser = getDefault(require('./parser/parser.js'));

module.exports = WebVTT;
