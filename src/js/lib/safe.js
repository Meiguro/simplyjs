/* safe.js - Building a safer world for Pebble.JS Developers
 *
 * This library provides wrapper around all the asynchronous handlers that developers
 * have access to so that error messages are caught and displayed nicely in the pebble tool
 * console.
 */

/* global __loader */

var ajax = require('ajax');

var safe = {};

/* The name of the concatenated file to translate */
safe.translateName = 'pebble-js-app.js';

safe.indent = '    ';

/* Translates a source line position to the originating file */
safe.translatePos = function(name, lineno, colno) {
  if (name === safe.translateName) {
    var pkg = __loader.getPackageByLineno(lineno);
    if (pkg) {
      name = pkg.filename;
      lineno -= pkg.lineno;
    }
  }
  return name + ':' + lineno + ':' + colno;
};


/* Translates an iOS stack tace line to node style */
safe.translateLineIOS = function(line, scope, name, lineno, colno) {
  var pos = safe.translatePos(name, lineno, colno);
  return safe.indent + 'at ' + (scope ? scope  + ' (' + pos + ')' : pos);
};

/* Matches (<scope> '@' )? <name> ':' <lineno> ':' <colno> */
var stackLineRegExp = /(?:([^\s@]+)@)?([^\s@:]+):(\d+):(\d+)/;

safe.translateStackIOS = function(stack) {
  var lines = stack.split('\n');
  for (var i = lines.length - 1; i >= 0; --i) {
    var line = lines[i];
    var m = line.match(stackLineRegExp);
    if (m) {
      line = lines[i] = safe.translateLineIOS.apply(this, m);
    }
    if (line.match(module.filename)) {
      lines.splice(--i, 2);
    }
  }
  return lines.join('\n');
};

safe.translateStackAndroid = function(stack) {
  var lines = stack.split('\n');
  for (var i = lines.length - 1; i > 0; --i) {
    var line = lines[i];
    var name, lineno, colno;
    if (line.match(/jskit_startup\.html/)) {
      lines.splice(i, 1);
    } else {
      var m = line.match(/^.*\/(.*?):(\d+):(\d+)/);
      if (m) {
        name = m[1];
        lineno = m[2];
        colno = m[3];
      }
    }
    if (name) {
      var pos = safe.translatePos(name, lineno, colno);
      console.log(pos, name, lineno, colno);
      if (line.match(/\(.*\)/)) {
        line = line.replace(/\(.*\)/, '(' + pos + ')');
      } else {
        line = line.replace(/[^\s\/]*\/.*$/, pos);
      }
      lines[i] = line;
    }
  }
  return lines.join('\n');
};

/* Translates a stack trace to the originating files */
safe.translateStack = function(stack) {
  if (stack.match('com.getpebble.android')) {
    return safe.translateStackAndroid(stack);
  } else {
    return safe.translateStackIOS(stack);
  }
};

safe.translateError = function(err) {
  var name = err.name;
  var message = err.message;
  var stack = err.stack;
  var result = ['JavaScript Error:'];
  if (message && (!stack || !stack.match(message))) {
    if (name && !message.match(message)) {
      message = name + ': ' + message;
    }
    result.push(message);
  }
  if (stack) {
    result.push(safe.translateStack(stack));
  }
  return result.join('\n');
};

/* We use this function to dump error messages to the console. */
safe.dumpError = function(err) {
  if (typeof err === 'object') {
      console.log(safe.translateError(err));
  } else {
    console.log('dumpError :: argument is not an object');
  }
};

/* Takes a function and return a new function with a call to it wrapped in a try/catch statement */
safe.protect = function(fn) {
  return function() {
    try {
      return fn.apply(this, arguments);
    }
    catch (err) {
      safe.dumpError(err);
    }
  };
};

/* Wrap event handlers added by Pebble.addEventListener */
var pblAddEventListener = Pebble.addEventListener;
Pebble.addEventListener = function(eventName, eventCallback) {
  pblAddEventListener.call(this, eventName, safe.protect(eventCallback));
};

var pblSendMessage = Pebble.sendAppMessage;
Pebble.sendAppMessage = function(message, success, failure) {
  return pblSendMessage.call(this, message, safe.protect(success), safe.protect(failure));
};

/* Wrap setTimeout and setInterval */
var originalSetTimeout = setTimeout;
window.setTimeout = function(callback, delay) {
  return originalSetTimeout(safe.protect(callback), delay);
};
var originalSetInterval = setInterval;
window.setInterval = function(callback, delay) {
  return originalSetInterval(safe.protect(callback), delay);
};

/* Wrap the success and failure callback of the ajax library */
ajax.onHandler = function(eventName, callback) {
  return safe.protect(callback);
};

/* Wrap the geolocation API Callbacks */
var watchPosition = navigator.geolocation.watchPosition;
navigator.geolocation.watchPosition = function(success, error, options) {
  return watchPosition.call(this, safe.protect(success), safe.protect(error), options);
};
var getCurrentPosition = navigator.geolocation.getCurrentPosition;
navigator.geolocation.getCurrentPosition = function(success, error, options) {
  return getCurrentPosition.call(this, safe.protect(success), safe.protect(error), options);
};

module.exports = safe;
