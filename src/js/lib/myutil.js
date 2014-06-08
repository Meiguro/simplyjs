var util2 = require('util2');

var myutil = {};

myutil.shadow = function(a, b) {
  for (var k in a) {
    if (typeof b[k] === 'undefined') {
      b[k] = a[k];
    }
  }
  return b;
};

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

/**
 * Returns an absolute path based on a root path and a relative path.
 */
myutil.abspath = function(root, path) {
  if (!path) {
    path = root;
  }
  if (path.match(/^\/\//)) {
    var m = root && root.match(/^(\w+:)\/\//);
    path = (m ? m[1] : 'http:') + path;
  }
  if (root && !path.match(/^\w+:\/\//)) {
    path = root + path;
  }
  return path;
};

/**
 *  Converts a name to a C constant name format of UPPER_CASE_UNDERSCORE.
 */
myutil.toCConstantName = function(x) {
  x = x.toUpperCase();
  x = x.replace(/[- ]/g, '_');
  return x;
};

module.exports = myutil;
