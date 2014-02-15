/**
 * Simply.js
 * @namespace simply
 */
var simply = (function() {

var noop = typeof util2 !== 'undefined' ? util2.noop : function() {};

var simply = {};

simply.state = {};
simply.packages = {};
simply.listeners = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  if (simply.inited) {
    simply.loadMainScript();
    return;
  }

  ajax.onHandler = function(type, handler) {
    return simply.wrapHandler(handler, 2);
  };

  simply.inited = true;

  simply.loadMainScript();
};

simply.wrapHandler = function() {
  return simply.impl.wrapHandler.apply(this, arguments);
};

simply.begin = function() {
};

simply.end = function() {
  simply.state.run = false;
};

simply.reset = function() {
  simply.state = {};
  simply.packages = {};
  simply.off();
  simply.state.run = true;
  simply.state.numPackages = 0;
};

/**
 * Simply.js event handler callback.
 * @callback simply.eventHandler
 * @param {simply.event} event - The event object with event specific information.
 */

/**
 * Subscribe to Pebble events.
 * See {@link simply.event} for the possible event types to subscribe to.
 * Subscribing to a Pebble event requires a handler. An event object will be passed to your handler with event information.
 * Events can have a subtype which can be used to filter events before the handler is called.
 * @memberOf simply
 * @param {string} type - The event type.
 * @param {string} [subtype] - The event subtype.
 * @param {simply.eventHandler} handler - The event handler. The handler will be called with corresponding event.
 * @see simply.event
 */
simply.on = function(type, subtype, handler) {
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  handler = simply.wrapHandler(handler);
  var typeMap = simply.listeners;
  var subtypeMap = (typeMap[type] || ( typeMap[type] = {} ));
  (subtypeMap[subtype] || ( subtypeMap[subtype] = [] )).push(handler);
};

/**
 * Unsubscribe from Pebble events.
 * When called without a handler, all handlers of the type and subtype are unsubscribe.
 * When called with no parameters, all handlers are unsubscribed.
 * @memberOf simply
 * @param {string} type - The event type.
 * @param {string} [subtype] - The event subtype.
 * @param {function} [handler] - The event handler to unsubscribe.
 * @see simply.on
 */
simply.off = function(type, subtype, handler) {
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  if (!type) {
    simply.listeners = {};
    return;
  }
  var typeMap = simply.listeners;
  if (!handler && subtype === 'all') {
    delete typeMap[type];
    return;
  }
  var subtypeMap = typeMap[type];
  if (!subtypeMap) {
    return;
  }
  if (!handler) {
    delete subtypeMap[subtype];
    return;
  }
  var handlers = subtypeMap[subtype];
  if (!handlers) {
    return;
  }
  var index = handlers.indexOf(handler);
  if (index === -1) {
    return;
  }
  handlers.splice(index, 1);
};

simply.emitToHandlers = function(type, handlers, e) {
  if (!handlers) {
    return;
  }
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    var handler = handlers[i];
    if (handler(e, type, i) === false) {
      return true;
    }
  }
  return false;
};

simply.emit = function(type, subtype, e) {
  if (!simply.state.run) {
    return;
  }
  if (!e) {
    e = subtype;
    subtype = null;
  }
  var typeMap = simply.listeners;
  var subtypeMap = typeMap[type];
  if (!subtypeMap) {
    return;
  }
  if (simply.emitToHandlers(type, subtypeMap[subtype], e) === true) {
    return true;
  }
  if (simply.emitToHandlers(type, subtypeMap.all, e) === true) {
    return true;
  }
  return false;
};

var pathToName = function(path) {
  var name = path;
  if (typeof name === 'string') {
    name = name.replace(simply.basepath(), '');
  }
  return name || simply.basename();
};

simply.getPackageByPath = function(path) {
  return simply.packages[pathToName(path)];
};

simply.makePackage = function(path) {
  var name = pathToName(path);
  var saveName = 'script:' + path;
  var pkg = simply.packages[name];

  if (!pkg) {
    pkg = simply.packages[name] = {
      name: name,
      saveName: saveName,
      filename: path
    };
  }

  return pkg;
};

simply.defun = function(fn, fargs, fbody) {
  if (!fbody) {
    fbody = fargs;
    fargs = [];
  }
  return new Function('return function ' + fn + '(' + fargs.join(', ') + ') {' + fbody + '}')();
};

simply.fexecPackage = function(script, pkg) {
  return function() {
    if (!simply.state.run) {
      return;
    }
    simply.defun(pkg.execName, ['module'], script)(pkg);
    return pkg.exports;
  };
};

simply.loadScript = function(scriptUrl, async) {
  console.log('loading: ' + scriptUrl);

  var pkg = simply.makePackage(scriptUrl);
  pkg.exports = {};

  var loader = noop;
  var useScript = function(script) {
    loader = simply.fexecPackage(script, pkg);
  };

  ajax({ url: scriptUrl, cache: false, async: async }, function(data) {
    if (data && data.length) {
      localStorage.setItem(pkg.saveName, data);
      useScript(data);
    }
  }, function(data, status) {
    data = localStorage.getItem(pkg.saveName);
    if (data && data.length) {
      console.log(status + ': failed, loading saved script instead');
      useScript(data);
    }
  });

  return simply.impl.loadPackage.call(this, pkg, loader);
};

simply.loadScriptUrl = function(scriptUrl) {
  if (typeof scriptUrl === 'string' && !scriptUrl.match(/^(\w+:)?\/\//)) {
    scriptUrl = 'http://' + scriptUrl;
  }

  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }

  if (scriptUrl) {
    simply.loadScript(scriptUrl, false);
  }
};

simply.loadMainScript = function() {
  simply.reset();
  simply.loadScriptUrl();
  simply.begin();
};

simply.basepath = function(path) {
  path = path || localStorage.getItem('mainJsUrl');
  return path.replace(/[^\/]*$/, '');
};

simply.basename = function(path) {
  path = path || localStorage.getItem('mainJsUrl');
  return path.match(/[^\/]*$/)[0];
};

/**
 * Loads external dependencies, allowing you to write a multi-file project.
 * This currently only supports a relative path to another javascript file.
 * @global
 * @param {string} path - The path to the dependency.
 */
simply.require = function(path) {
  if (!path.match(/\.js$/)) {
    path += '.js';
  }
  var package = simply.packages[path];
  if (package) {
    return package.value;
  }
  var basepath = simply.basepath();
  return simply.loadScript(basepath + path, false);
};

/**
 * The text definition parameter for {@link simply.text}.
 * @typedef {object} simply.textDef
 * @property {string} title - A new title for the first and largest text field.
 * @property {string} subtitle - A new subtitle for the second large text field.
 * @property {string} body - A new body for the last text field meant to display large bodies of text.
 */

/**
 * Sets a group of text fields at once.
 * For example, passing a text definition { title: 'A', subtitle: 'B', body: 'C' }
 * will set the title, subtitle, and body simultaneously. Not all fields need to be specified.
 * When setting a single field, consider using the specific text setters simply.title, simply.subtitle, simply.body.
 * @memberOf simply
 * @param {simply.textDef} textDef - An object defining new text values.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.text = function(textDef, clear) {
  return simply.impl.text.apply(this, arguments);
};

simply.setText = simply.text;

/**
 * Sets the title field. The title field is the first and largest text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.title = function(text, clear) {
  return simply.impl.textfield('title', text, clear);
};

/**
 * Sets the subtitle field. The subtitle field is the second large text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.subtitle = function(text, clear) {
  return simply.impl.textfield('subtitle', text, clear);
};

/**
 * Sets the body field. The body field is the last text field available meant to display large bodies of text.
 * This can be used to display entire text interfaces.
 * You may even clear the title and subtitle fields in order to display more in the body field.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.body = function(text, clear) {
  return simply.impl.textfield('body', text, clear);
};

/**
 * Vibrates the Pebble.
 * There are three support vibe types: short, long, and double.
 * @memberOf simply
 * @param {string} [type] - The vibe type. Defaults to short.
 */
simply.vibe = function() {
  return simply.impl.vibe.apply(this, arguments);
};

/**
 * Enable scrolling in the Pebble UI.
 * When scrolling is enabled, up and down button presses are no longer forwarded to JavaScript handlers.
 * Single select, long select, and accel tap events are still available to you however.
 * @memberOf simply
 * @param {boolean} scrollable - Whether to enable a scrollable view.
 */

simply.scrollable = function(scrollable) {
  return simply.impl.scrollable.apply(this, arguments);
};

/**
 * Enable fullscreen in the Pebble UI.
 * Fullscreen removes the Pebble status bar, giving slightly more vertical display height.
 * @memberOf simply
 * @param {boolean} fullscreen - Whether to enable fullscreen mode.
 */

simply.fullscreen = function(fullscreen) {
  return simply.impl.fullscreen.apply(this, arguments);
};

/**
 * Set the Pebble UI style.
 * The available styles are 'small', 'large', and 'mono'. Small and large correspond to the system notification styles.
 * Mono sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.
 * @memberOf simply
 * @param {string} type - The type of style to set: 'small', 'large', or 'mono'.
 */

simply.style = function(type) {
  return simply.impl.style.apply(this, arguments);
};

/**
 * Simply.js event. See all the possible event types. Subscribe to events using {@link simply.on}.
 * @typedef simply.event
 * @see simply.clickEvent
 * @see simply.accelTapEvent
 */

/**
 * Simply.js button click event. This can either be a single click or long click.
 * Use the event type 'singleClick' or 'longClick' to subscribe to these events.
 * @typedef simply.clickEvent
 * @property {string} button - The button that was pressed: 'up', 'select', or 'down'. This is also the event subtype.
 */

/**
 * Simply.js accel tap event.
 * Use the event type 'accelTap' to subscribe to these events.
 * @typedef simply.accelTapEvent
 * @property {string} axis - The axis the tap event occurred on: 'x', 'y', or 'z'. This is also the event subtype.
 * @property {number} direction - The direction of the tap along the axis: 1 or -1.
 */

simply.emitClick = function(type, button) {
  simply.emit(type, button, {
    button: button,
  });
};

simply.emitAccelTap = function(axis, direction) {
  simply.emit('accelTap', axis, {
    axis: axis,
    direction: direction,
  });
};

return simply;

})();

Pebble.require = require;
var require = simply.require;
