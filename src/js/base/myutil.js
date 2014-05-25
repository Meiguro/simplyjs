var util2 = require('lib/util2');

var myutil = {};

myutil.defun = function(fn, fargs, fbody) {
  if (!fbody) {
    fbody = fargs;
    fargs = [];
  }
  return new Function('return function ' + fn + '(' + fargs.join(', ') + ') {' + fbody + '}')();
};

myutil.slog = function() {
  var args = [];
  for (var i = 0, ii = arguments.length; i < ii; ++i) {
    args[i] = util2.toString(arguments[i]);
  }
  return args.join(' ');
};

myutil.toObject = function(key, value) {
  if (typeof key === 'object') {
    return key;
  }
  var obj = {};
  obj[key] = value;
  return obj;
};

myutil.flag = function(flags) {
  if (typeof flags === 'boolean') {
    return flags;
  }
  for (var i = 1, ii = arguments.length; i < ii; ++i) {
    if (flags[arguments[i]]) {
      return true;
    }
  }
  return false;
};

myutil.toFlags = function(flags) {
  if (typeof flags === 'string') {
    flags = myutil.toObject(flags, true);
  } else {
    flags = !!flags;
  }
  return flags;
};

myutil.unset = function(obj, k) {
  if (typeof k === 'undefined') {
    k = obj;
    obj = this.state;
  }
  if (typeof obj === 'object') {
    delete obj[k];
  }
};

myutil.makeAccessor = function(k) {
  return function(value) {
    if (arguments.length === 0) {
      return this.state[k];
    } else {
      this.state[k] = value;
      if (this._prop() === this) {
        this._prop(k, value);
      }
      return this;
    }
  };
};

module.exports = myutil;
