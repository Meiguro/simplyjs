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
var Window = require('ui/window');
var Card = require('ui/card');
var Menu = require('ui/menu');

var simply = module.exports;

simply.settings = Settings;

simply.accel = Accel;

simply.ui = {};
simply.ui.Card = Card;
simply.ui.Menu = Menu;

var state = simply.state = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  if (!simply.inited) {
    simply.inited = new Date().getTime();

    ajax.onHandler = function(type, handler) {
      return simply.wrapHandler(handler, 2);
    };

    Emitter.onAddHandler = simply.onAddHandler;
    Emitter.onRemoveHandler = simply.onRemoveHandler;
  }

  simply.loadMainScript();
};

simply.wrapHandler = function(handler) {
  return package.impl.wrapHandler.apply(this, arguments);
};

simply.reset = function() {
  if (state.emitter) {
    simply.off();
  }

  simply.state = state = {};

  state.run = true;

  var emitter = new Emitter();
  emitter.wrapHandler = simply.wrapHandler;
  state.emitter = emitter;

  var windowStack = new WindowStack();
  windowStack.on('show', simply.onShowWindow);
  windowStack.on('hide', simply.onHideWindow);
  state.windowStack = windowStack;

  Settings.init();

  Accel.init();

  ImageService.init();
};

simply.listenerCount = function(type, subtype) {
  var count = 0;
  var wind = simply.topWindow();
  if (wind) {
    count += wind.listenerCount(type, subtype);
  }
  return count;
};

simply.onShowWindow = function(e) {
  var wind = e.window;
  wind.forEachListener(wind.onAddHandler);
};

simply.onHideWindow = function(e) {
  var wind = e.window;
  wind.forEachListener(wind.onAddHandler);
};

simply.topWindow = function() {
  return state.windowStack.top();
};

simply.getWindow = function(windowId) {
  return state.windowStack.get(windowId);
};

simply.showWindow = function(wind) {
  state.windowStack.push(wind);
};

simply.hideWindow = function(wind, broadcast) {
  state.windowStack.remove(wind, broadcast);
};

simply.hideWindowById = function(windowId, broadcast) {
  var wind = simply.getWindow(windowId);
  if (wind) {
    simply.hideWindow(wind, broadcast);
  }
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
  var wind = simply.topWindow();
  if (!wind || !(wind instanceof Card)) {
    wind = new Card(textDef);
    wind.show();
  } else {
    wind.prop(textDef, true);
  }
};

simply.window = function(windowDef) {
  var wind = simply.topWindow();
  if (wind === this) {
    simply.impl.window.apply(this, arguments);
  }
};

simply.card = function(windowDef) {
  var wind = simply.topWindow();
  if (wind === this) {
    simply.impl.card.apply(this, arguments);
  }
};

simply.menu = function(menuDef) {
  var wind = simply.topWindow();
  if (wind === this) {
    simply.impl.menu.apply(this, arguments);
  }
};

simply.action = function(actionDef) {
  var wind = simply.topWindow();
  if (wind === this) {
    simply.impl.window({ action: typeof actionDef === 'boolean' ? actionDef : this.state.action }, 'action');
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

/**
 * Simply.js button click event. This can either be a single click or long click.
 * Use the event type 'singleClick' or 'longClick' to subscribe to these events.
 * @typedef simply.clickEvent
 * @property {string} button - The button that was pressed: 'back', 'up', 'select', or 'down'. This is also the event subtype.
 */

simply.emitWindow = function(type, subtype, e, klass) {
  var wind = e.window = simply.topWindow();
  if (klass) {
    e[klass._codeName] = wind;
  }
  if (wind && wind.emit(type, subtype, e) === false) {
    return false;
  }
};

simply.emitClick = function(type, button) {
  var e = {
    button: button,
  };
  return simply.emitWindow(type, button, e);
};

simply.emitMenu = function(type, subtype, e) {
  simply.emitWindow(type, subtype, e, Menu);
};

simply.emitMenuSection = function(section) {
  var menu = simply.topWindow();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section
  };
  if (simply.emitMenu('section', null, e) === false) {
    return false;
  }
  menu._resolveSection(e);
};

simply.emitMenuItem = function(section, item) {
  var menu = simply.topWindow();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section,
    item: item,
  };
  if (simply.emitMenu('item', null, e) === false) {
    return false;
  }
  menu._resolveItem(e);
};

simply.emitMenuSelect = function(type, section, item) {
  var menu = simply.topWindow();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section,
    item: item,
  };
  switch (type) {
    case 'menuSelect': type = 'select'; break;
    case 'menuLongSelect': type = 'longSelect'; break;
  }
  if (simply.emitMenu(type, null, e) === false) {
    return false;
  }
  menu._emitSelect(e);
};
