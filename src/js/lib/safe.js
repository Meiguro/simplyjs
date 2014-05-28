/* safe.js - Building a safer world for Pebble.JS Developers
 *
 * This library provides wrapper around all the asynchronous handlers that developers
 * have access to so that error messages are caught and displayed nicely in the pebble tool
 * console.
 */

var ajax = require('lib/ajax');

/* The name of the concatenated file to translate */
var translateName = 'pebble-js-app.js';

/* Translates a line of the stack trace to the originating file */
function translateLine(line, scope, name, lineno, colno) {
  if (name === translateName) {
    var pkg = __loader.getPackageByLineno(lineno);
    if (pkg) {
      name = pkg.filename;
      lineno -= pkg.lineno;
    }
  }
  return (scope || '') + name + ':' + lineno + ':' + colno;
}

/* Matches (<scope> '@' )? <name> ':' <lineno> ':' <colno> */
var stackLineRegExp = /([^\s@]+@)?([^\s@:]+):(\d+):(\d+)/;

/* Translates a stack trace to the originating files */
function translateStack(stack) {
  var lines = stack.split('\n');
  for (var i = lines.length - 1; i >= 0; --i) {
    var line = lines[i];
    var m = line.match(stackLineRegExp);
    if (m) {
      line = lines[i] = translateLine.apply(this, m);
    }
    if (line.match(module.filename)) {
      lines.splice(--i, 2);
    }
  }
  return lines.join('\n');
}

/* We use this function to dump error messages to the console. */
function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('Message: ' + err.message);
    }
    if (err.stack) {
      console.log('Stacktrace:');
      console.log(translateStack(err.stack));
    }
  } else {
    console.log('dumpError :: argument is not an object');
  }
}

/* Takes a function and return a new function with a call to it wrapped in a try/catch statement */
function protect(fn) {
  return function() {
    try {
      return fn.apply(this, arguments);
    }
    catch (err) {
      dumpError(err);
    }
  };
}

/* Wrap event handlers added by Pebble.addEventListener */
var pblAddEventListener = Pebble.addEventListener;
Pebble.addEventListener = function(eventName, eventCallback) {
  pblAddEventListener.call(this, eventName, protect(eventCallback));
};

var pblSendMessage = Pebble.sendAppMessage;
Pebble.sendAppMessage = function(message, success, failure) {
  return pblSendMessage.call(this, message, protect(success), protect(failure));
};

/* Wrap setTimeout and setInterval */
var originalSetTimeout = setTimeout;
setTimeout = function(callback, delay) {
  return originalSetTimeout(protect(callback), delay);
};
var originalSetInterval = setInterval;
setInterval = function(callback, delay) {
  return originalSetInterval(protect(callback), delay);
};

/* Wrap the success and failure callback of the ajax library */
ajax.onHandler = function(eventName, callback) {
  return protect(callback);
};

/* Wrap the geolocation API Callbacks */
var watchPosition = navigator.geolocation.watchPosition;
navigator.geolocation.watchPosition = function(success, error, options) {
  return watchPosition.call(this, protect(success), protect(error), options);
};
var getCurrentPosition = navigator.geolocation.getCurrentPosition;
navigator.geolocation.getCurrentPosition = function(success, error, options) {
  return getCurrentPosition.call(this, protect(success), protect(error), options);
};
