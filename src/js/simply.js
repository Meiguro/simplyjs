/**
 * Simply.js
 * @namespace simply
 */

var ajax = require('lib/ajax');
var util2 = require('lib/util2');

var myutil = require('base/myutil');
var package = require('base/package');
var Emitter = require('base/emitter');
var Settings = require('base/settings');
var Accel = require('base/accel');
var ImageService = require('base/image');

var WindowStack = require('ui/windowstack');
var Card = require('ui/card');

require('exports');

var simply = module.exports;

ajax.onHandler = function(type, handler) {
  return simply.wrapHandler(handler, 2);
};

Emitter.prototype.wrapHandler = simply.wrapHandler;

simply.init = function() {
  package.loadMainScript();
};

simply.wrapHandler = function(handler) {
  return package.impl.wrapHandler.apply(this, arguments);
};

simply.reset = function() {
  simply.run = true;

  Settings.init();
  Accel.init();
  ImageService.init();
  WindowStack.init();
};

simply.text = function(textDef) {
  var wind = WindowStack.top();
  if (!wind || !(wind instanceof Card)) {
    wind = new Card(textDef);
    wind.show();
  } else {
    wind.prop(textDef, true);
  }
};

/**
 * Vibrates the Pebble.
 * There are three support vibe types: short, long, and double.
 * @memberOf simply
 * @param {string} [type=short] - The vibe type.
 */
simply.vibe = function() {
  return simply.impl.vibe.apply(this, arguments);
};
