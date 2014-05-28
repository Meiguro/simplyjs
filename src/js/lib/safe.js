/* safe.js - Building a safer world for Pebble.JS Developers
 *
 * This library provides wrapper around all the asynchronous handlers that developers
 * have access to so that error messages are caught and displayed nicely in the pebble tool
 * console.
 */

var ajax = require('lib/ajax');

/* We use this function to dump error messages to the console. */
function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('Message: ' + err.message);
    }
    if (err.stack) {
      console.log('Stacktrace:');
      console.log(err.stack);
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
