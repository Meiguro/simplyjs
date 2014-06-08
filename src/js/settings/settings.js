var util2 = require('util2');

var Settings = module.exports;

var state;

Settings.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

Settings.init = function() {
  state = Settings.state = {
    options: {},
    listeners: [],
  };
  // Register listeners for the Settings
  Pebble.addEventListener('showConfiguration', Settings.onOpenConfig);
  Pebble.addEventListener('webviewclosed', Settings.onCloseConfig);
};

Settings.mainScriptUrl = function(scriptUrl) {
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

var getOptionsKey = function(path) {
  return 'options:' + path;
};

Settings.saveOptions = function(path) {
  var options = state.options;
  localStorage.setItem(getOptionsKey(path), JSON.stringify(options));
};

Settings.loadOptions = function(path) {
  state.options = {};
  var options = localStorage.getItem(getOptionsKey(path));
  try {
    options = JSON.parse(options);
  } catch (e) {}
  if (typeof options === 'object' && options !== null) {
    state.options = options;
  }
};

Settings.option = function(key, value) {
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
    Settings.saveOptions();
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

Settings.getBaseOptions = function() {
  return {
    scriptUrl: Settings.mainScriptUrl(),
  };
};

Settings.config = function(opt, open, close) {
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
  state.listeners.push(listener);
};

Settings.onOpenConfig = function(e) {
  console.log("Settings.onOpenConfig");
  var options;
  var url;
  var listener = util2.last(state.listeners);
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
    url = Settings.settingsUrl;
    options = Settings.getBaseOptions();
  }
  var hash = encodeURIComponent(JSON.stringify(options));
  Pebble.openURL(url + '#' + hash);
};

Settings.onCloseConfig = function(e) {
  var listener = util2.last(state.listeners);
  var options = {};
  if (e.response && e.response !== 'CANCELLED') {
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
};
