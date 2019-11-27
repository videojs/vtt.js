// A settings object holds key/value pairs and will ignore anything but the first
// assignment to a specific key.
function Settings() {
  this.values = Object.create(null);
}

Settings.prototype = {
  // Only accept the first assignment to any key.
  set: function(k, v) {
    if (!this.get(k) && v !== "") {
      this.values[k] = v;
    }
  },
  // Return the value for a key, or a default value.
  // If 'defaultKey' is passed then 'dflt' is assumed to be an object with
  // a number of possible default values as properties where 'defaultKey' is
  // the key of the property that will be chosen; otherwise it's assumed to be
  // a single value.
  get: function(k, dflt, defaultKey) {
    if (defaultKey) {
      return this.has(k) ? this.values[k] : dflt[defaultKey];
    }
    return this.has(k) ? this.values[k] : dflt;
  },
  // Check whether we have a value for a key.
  has: function(k) {
    return k in this.values;
  },
  // Accept a setting if its one of the given alternatives.
  alt: function(k, v, a) {
    for (var n = 0; n < a.length; ++n) {
      if (v === a[n]) {
        this.set(k, v);
        break;
      }
    }
  },
  // Accept a setting if its a valid (signed) integer.
  integer: function(k, v) {
    if (/^-?\d+$/.test(v)) { // integer
      this.set(k, parseInt(v, 10));
    }
  },
  // Accept a setting if its a valid percentage.
  percent: function(k, v) {
    // eslint-disable-next-line
    var m;
    if ((m = v.match(/^([\d]{1,3})(\.[\d]*)?%$/))) {
      v = parseFloat(v);
      if (v >= 0 && v <= 100) {
        this.set(k, v);
        return true;
      }
    }
    return false;
  }
};

module.exports = Settings;
