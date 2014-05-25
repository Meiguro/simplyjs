/**
 * Simply.js
 * @namespace simply
 */

var ajax = require('lib/ajax');
var util2 = require('lib/util2');

var myutil = require('base/myutil');
var package = require('base/package');
var Emitter = require('base/emitter');
var Accel = require('base/accel');
var ImageService = require('base/image');

var WindowStack = require('ui/windowstack');
var Window = require('ui/window');
var Card = require('ui/card');
var Menu = require('ui/menu');

var simply = module.exports;

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
  state.options = {};

  var emitter = new Emitter();
  emitter.wrapHandler = simply.wrapHandler;
  state.emitter = emitter;

  var windowStack = new WindowStack();
  windowStack.on('show', simply.onShowWindow);
  windowStack.on('hide', simply.onHideWindow);
  state.windowStack = windowStack;

  state.webview = {
    listeners: [],
  };

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

simply.loadMainScriptUrl = function(scriptUrl) {
  if (typeof scriptUrl === 'string' && scriptUrl.length && !scriptUrl.match(/^(\w+:)?\/\//)) {
    scriptUrl = 'http://' + scriptUrl;
  }

  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }

  return scriptUrl;
};

simply.loadMainScript = function(scriptUrl) {
  simply.reset();
  scriptUrl = simply.loadMainScriptUrl(scriptUrl);
  if (!scriptUrl) {
    return;
  }
  simply.loadOptions(scriptUrl);
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

var getOptionsKey = function(path) {
  return 'options:' + (path || package.module.filename);
};

simply.saveOptions = function(path) {
  var options = state.options;
  localStorage.setItem(getOptionsKey(path), JSON.stringify(options));
};

simply.loadOptions = function(path) {
  state.options = {};
  var options = localStorage.getItem(getOptionsKey(path));
  try {
    options = JSON.parse(options);
  } catch (e) {}
  if (typeof options === 'object' && options !== null) {
    state.options = options;
  }
};

simply.option = function(key, value) {
  var options = state.options;
  if (arguments.length >= 2) {
    if (typeof value === 'undefined') {
      delete options[key];
    } else {
      try {
        value = JSON.stringify(value);
      } catch (e) {}
      options[key] = '' + value;
    }
    simply.saveOptions();
  }
  value = options[key];
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  try {
    value = JSON.parse(value);
  } catch (e) {}
  return value;
};

simply.getBaseOptions = function() {
  return {
    scriptUrl: localStorage.getItem('mainJsUrl'),
  };
};

simply.settings = function(opt, open, close) {
  if (typeof opt === 'string') {
    opt = { url: opt };
  }
  if (typeof close === 'undefined') {
    close = open;
    open = util2.noop;
  }
  var listener = {
    params: opt,
    open: open,
    close: close,
  };
  state.webview.listeners.push(listener);
};

simply.openSettings = function(e) {
  var options;
  var url;
  var listener = util2.last(state.webview.listeners);
  if (listener) {
    url = listener.params.url;
    options = state.options;
    e = {
      originalEvent: e,
      options: options,
      url: listener.params.url,
    };
    listener.open(e);
  } else {
    url = simply.settingsUrl;
    options = simply.getBaseOptions();
  }
  var hash = encodeURIComponent(JSON.stringify(options));
  Pebble.openURL(url + '#' + hash);
};

simply.closeSettings = function(e) {
  var listener = util2.last(state.webview.listeners);
  var options = {};
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
  }
  if (listener) {
    e = {
      originalEvent: e,
      options: options,
      url: listener.params.url,
    };
    return listener.close(e);
  }
  if (options.scriptUrl) {
    simply.loadMainScript(options.scriptUrl);
  }
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
