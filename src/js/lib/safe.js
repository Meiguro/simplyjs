/* safe.js - Building a safer world for Pebble.JS Developers
 *
 * This library provides wrapper around all the asynchronous handlers that developers
 * have access to so that error messages are caught and displayed nicely in the pebble tool
 * console.
 */

/* global __loader */

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

var makeTranslateStack = function(stackLineRegExp, translateLine) {
  return function(stack) {
    var lines = stack.split('\n');
    for (var i = lines.length - 1; i >= 0; --i) {
      var line = lines[i];
      var m = line.match(stackLineRegExp);
      if (m) {
        line = lines[i] = translateLine.apply(this, m);
      }
      if (line.match(module.filename)) {
        lines.splice(i, 1);
      }
    }
    return lines.join('\n');
  };
};

/* Translates a node style stack trace line */
var translateLineV8 = function(line, msg, scope, name, lineno, colno) {
  var pos = safe.translatePos(name, lineno, colno);
  return msg + (scope ? ' ' + scope + ' (' + pos + ')' : pos);
};

/* Matches <msg> (<scope> '(')? <name> ':' <lineno> ':' <colno> ')'? */
var stackLineRegExpV8 = /(.+?)(?:\s+([^\s]+)\s+\()?([^\s@:]+):(\d+):(\d+)\)?/;

safe.translateStackV8 = makeTranslateStack(stackLineRegExpV8, translateLineV8);

/* Translates an iOS stack trace line to node style */
var translateLineIOS = function(line, scope, name, lineno, colno) {
  var pos = safe.translatePos(name, lineno, colno);
  return safe.indent + 'at ' + (scope ? scope  + ' (' + pos + ')' : pos);
};

/* Matches (<scope> '@' )? <name> ':' <lineno> ':' <colno> */
var stackLineRegExpIOS = /(?:([^\s@]+)@)?([^\s@:]+):(\d+):(\d+)/;

safe.translateStackIOS = makeTranslateStack(stackLineRegExpIOS, translateLineIOS);

safe.translateStackAndroid = function(stack) {
  var lines = stack.split('\n');
  for (var i = lines.length - 1; i > 0; --i) {
    var line = lines[i];
    var name, lineno, colno;
    if (line.match(/jskit_startup\.html/)) {
      lines.splice(i, 1);
    } else {
      /* Matches <name> ':' <lineno> ':' <colno> */
      var m = line.match(/^.*\/(.*?):(\d+):(\d+)/);
      if (m) {
        name = m[1];
        lineno = m[2];
        colno = m[3];
      }
    }
    if (name) {
      var pos = safe.translatePos(name, lineno, colno);
      if (line.match(/\(.*\)/)) {
        line = line.replace(/\(.*\)/, '(' + pos + ')');
      } else {
        line = line.replace(/[^\s\/]*\/.*$/, pos);
      }
      lines[i] = line;
    }
    if (line.match(module.filename)) {
      lines.splice(i, 1);
    }
  }
  return lines.join('\n');
};

/* Translates a stack trace to the originating files */
safe.translateStack = function(stack) {
  if (Pebble.platform === 'pypkjs') {
    return safe.translateStackV8(stack);
  } else if (stack.match('com.getpebble.android')) {
    return safe.translateStackAndroid(stack);
  } else {
    return safe.translateStackIOS(stack);
  }
};

safe.translateError = function(err, intro) {
  var name = err.name;
  var message = err.message || err.toString();
  var stack = err.stack;
  var result = [intro || 'JavaScript Error:'];
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

/* Dumps error messages to the console. */
safe.dumpError = function(err, intro) {
  if (typeof err === 'object') {
    console.log(safe.translateError(err, intro));
  } else {
    console.log('Error: dumpError argument is not an object');
  }
};

/* Logs runtime warnings to the console. */
safe.warn = function(message, name) {
  var err = new Error(message);
  err.name = name || 'Warning';
  safe.dumpError(err, 'Warning:');
};

/* Takes a function and return a new function with a call to it wrapped in a try/catch statement */
safe.protect = function(fn) {
  return fn ? function() {
    try {
      fn.apply(this, arguments);
    } catch (err) {
      safe.dumpError(err);
    }
  } : undefined;
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
  if (safe.warnSetTimeoutNotFunction !== false && typeof callback !== 'function') {
    safe.warn('setTimeout was called with a `' + (typeof callback) + '` type. ' +
              'Did you mean to pass a function?');
    safe.warnSetTimeoutNotFunction = false;
  }
  return originalSetTimeout(safe.protect(callback), delay);
};

var originalSetInterval = setInterval;
window.setInterval = function(callback, delay) {
  if (safe.warnSetIntervalNotFunction !== false && typeof callback !== 'function') {
    safe.warn('setInterval was called with a `' + (typeof callback) + '` type. ' +
              'Did you mean to pass a function?');
    safe.warnSetIntervalNotFunction = false;
  }
  return originalSetInterval(safe.protect(callback), delay);
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

var ajax;

/* Try to load the ajax library if available and silently fail if it is not found. */
try {
  ajax = require('ajax');
} catch (err) {}

/* Wrap the success and failure callback of the ajax library */
if (ajax) {
  ajax.onHandler = function(eventName, callback) {
    return safe.protect(callback);
  };
}

module.exports = safe;
