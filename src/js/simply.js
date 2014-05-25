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
var Menu = require('ui/menu');

var simply = module.exports;

simply.settings = Settings;

simply.accel = Accel;

simply.ui = {};
simply.ui.Card = Card;
simply.ui.Menu = Menu;

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  if (!simply.inited) {
    simply.inited = new Date().getTime();

    ajax.onHandler = function(type, handler) {
      return simply.wrapHandler(handler, 2);
    };

    Emitter.prototype.wrapHandler = simply.wrapHandler;

    Emitter.onAddHandler = simply.onAddHandler;
    Emitter.onRemoveHandler = simply.onRemoveHandler;
  }

  simply.loadMainScript();
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

simply.mainScriptUrl = function(scriptUrl) {
  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }
  return scriptUrl;
};

simply.loadMainScriptUrl = function(scriptUrl) {
  if (typeof scriptUrl === 'string' && scriptUrl.length && !scriptUrl.match(/^(\w+:)?\/\//)) {
    scriptUrl = 'http://' + scriptUrl;
  }

  scriptUrl = simply.mainScriptUrl(scriptUrl);

  return scriptUrl;
};

simply.loadMainScript = function(scriptUrl) {
  simply.reset();
  scriptUrl = simply.loadMainScriptUrl(scriptUrl);
  if (!scriptUrl) {
    return;
  }
  Settings.loadOptions(scriptUrl);
  try {
    package.loadScript(scriptUrl, false);
  } catch (e) {
    simply.text({
      title: 'Failed to load',
      body: scriptUrl,
    }, true);
    return;
  }
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
