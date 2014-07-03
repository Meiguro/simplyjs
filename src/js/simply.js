/**
 * Simply.js
 * @namespace simply
 */
var simply = (function() {

var noop = typeof util2 !== 'undefined' ? util2.noop : function() {};

var simply = {};

var buttons = [
  'back',
  'up',
  'select',
  'down',
];

var eventTypes = [
  'singleClick',
  'longClick',
  'accelTap',
  'accelData',
];

simply.state = {};
simply.packages = {};
simply.listeners = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  if (!simply.inited) {
    simply.inited = true;
    ajax.onHandler = function(type, handler) {
      return simply.wrapHandler(handler, 2);
    };
  }

  simply.loadMainScript();
};

simply.wrapHandler = function(handler) {
  return simply.impl.wrapHandler.apply(this, arguments);
};

simply.begin = function() {
};

simply.end = function() {
  simply.state.run = false;
};

simply.reset = function() {
  simply.off();

  simply.packages = {};

  simply.state = {};
  simply.state.run = true;
  simply.state.numPackages = 0;

  simply.state.button = {
    config: {},
    configMode: 'auto',
  };
  for (var i = 0, ii = buttons.length; i < ii; i++) {
    var button = buttons[i];
    if (button !== 'back') {
      simply.state.button.config[buttons[i]] = true;
    }
  }

  simply.accelInit();
};

/**
 * Simply.js event handler callback.
 * @callback simply.eventHandler
 * @param {simply.event} event - The event object with event specific information.
 */

var isBackEvent = function(type, subtype) {
  return ((type === 'singleClick' || type === 'longClick') && subtype === 'back');
};

simply.onAddHandler = function(type, subtype) {
  if (isBackEvent(type, subtype)) {
    simply.buttonAutoConfig();
  } else if (type === 'accelData') {
    simply.accelAutoSubscribe();
  }
};

simply.onRemoveHandler = function(type, subtype) {
  if (!type || isBackEvent(type, subtype)) {
    simply.buttonAutoConfig();
  }
  if (!type || type === 'accelData') {
    simply.accelAutoSubscribe();
  }
};

simply.countHandlers = function(type, subtype) {
  if (!subtype) {
    subtype = 'all';
  }
  var typeMap = simply.listeners;
  var subtypeMap = typeMap[type];
  if (!subtypeMap) {
    return 0;
  }
  var handlers = subtypeMap[subtype];
  return handlers ? handlers.length : 0;
};

var checkEventType = function(type) {
  if (eventTypes.indexOf(type) === -1) {
    throw Error('Invalid event type: ' + type);
  }
};

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
  if (type) {
    checkEventType(type);
  }
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  simply.rawOn(type, subtype, handler);
  simply.onAddHandler(type, subtype);
};

simply.rawOn = function(type, subtype, handler) {
  var typeMap = simply.listeners;
  var subtypeMap = (typeMap[type] || ( typeMap[type] = {} ));
  (subtypeMap[subtype] || ( subtypeMap[subtype] = [] )).push({
    id: handler,
    handler: simply.wrapHandler(handler),
  });
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
  if (type) {
    checkEventType(type);
  }
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  simply.rawOff(type, subtype, handler);
  simply.onRemoveHandler(type, subtype);
};

simply.rawOff = function(type, subtype, handler) {
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
  var index = -1;
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    if (handlers[i].id === handler) {
      index = i;
      break;
    }
  }
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
    var handler = handlers[i].handler;
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
  // console shim for Android
  var console2 = {};
  for (var k in console) {
    console2[k] = console[k];
  }

  console2.log = function() {
    var args = [];
    for (var i = 0, ii = arguments.length; i < ii; ++i) {
      args[i] = arguments[i].toString();
    }
    var msg = pkg.name + ': ' + args.join(' ');
    var width = 45;
    var prefix = (new Array(width + 1)).join('\b'); // erase Simply.js source line
    var suffix = msg.length < width ? (new Array(width - msg.length + 1)).join(' ') : '';
    console.log(prefix + msg + suffix);
  };

  // loader
  return function() {
    if (!simply.state.run) {
      return;
    }
    var exports = pkg.exports;
    var result = simply.defun(pkg.execName,
      ['module', 'require', 'console', 'Pebble', 'simply'], script)
      (pkg, simply.require, console2, Pebble, simply);

    // backwards compatibility for return-style modules
    if (pkg.exports === exports && result) {
      pkg.exports = result;
    }

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
  try {
    simply.loadScript(scriptUrl, false);
  } catch (e) {
    simply.text({
      title: 'Failed to load',
      body: scriptUrl,
    }, true);
    return;
  }
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
 * Package loading loosely follows the CommonJS format.
 * Exporting is possible by modifying or setting module.exports within the required file.
 * The module path is also available as module.path.
 * This currently only supports a relative path to another JavaScript file.
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
 * The button configuration parameter for {@link simply.buttonConfig}.
 * The button configuration allows you to enable to disable buttons without having to register or unregister handlers if that is your preferred style.
 * You may also enable the back button manually as an alternative to registering a click handler with 'back' as its subtype using {@link simply.on}.
 * @typedef {object} simply.buttonConf
 * @property {boolean} [back] - Whether to enable the back button. Initializes as false. Simply.js can also automatically register this for you based on the amount of click handlers with subtype 'back'.
 * @property {boolean} [up] - Whether to enable the up button. Initializes as true. Note that this is disabled when using {@link simply.scrollable}.
 * @property {boolean} [select] - Whether to enable the select button. Initializes as true.
 * @property {boolean} [down] - Whether to enable the down button. Initializes as true. Note that this is disabled when using {@link simply.scrollable}.
 */

/**
 * Changes the button configuration.
 * See {@link simply.buttonConfig}
 * @memberOf simply
 * @param {simply.buttonConfig} buttonConf - An object defining the button configuration.
 */
simply.buttonConfig = function(buttonConf, auto) {
  var buttonState = simply.state.button;
  if (typeof buttonConf === 'undefined') {
    var config = {};
    for (var i = 0, ii = buttons.length; i < ii; ++i) {
      var k = buttons[i];
      config[k] = buttonConf.config[k];
    }
    return config;
  }
  for (var k in buttonConf) {
    if (buttons.indexOf(k) !== -1) {
      if (k === 'back') {
        buttonState.configMode = buttonConf.back && !auto ? 'manual' : 'auto';
      }
      buttonState.config[k] = buttonConf[k];
    }
  }
  if (simply.impl.buttonConfig) {
    return simply.impl.buttonConfig(buttonState.config);
  }
};

simply.buttonAutoConfig = function() {
  var buttonState = simply.state.button;
  if (!buttonState || buttonState.configMode !== 'auto') {
    return;
  }
  var singleBackCount = simply.countHandlers('singleClick', 'back');
  var longBackCount = simply.countHandlers('longClick', 'back');
  var useBack = singleBackCount + longBackCount > 0;
  if (useBack !== buttonState.config.back) {
    buttonState.config.back = useBack;
    return simply.buttonConfig(buttonState.config, true);
  }
};

/**
 * The text definition parameter for {@link simply.text}.
 * @typedef {object} simply.textDef
 * @property {string} [title] - A new title for the first and largest text field.
 * @property {string} [subtitle] - A new subtitle for the second large text field.
 * @property {string} [body] - A new body for the last text field meant to display large bodies of text.
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
 * @param {string} [type=short] - The vibe type.
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

simply.accelInit = function() {
  simply.state.accel = {
    rate: 100,
    samples: 25,
    subscribe: false,
    subscribeMode: 'auto',
    listeners: [],
  };
};

simply.accelAutoSubscribe = function() {
  var accelState = simply.state.accel;
  if (!accelState || accelState.subscribeMode !== 'auto') {
    return;
  }
  var subscribe = simply.countHandlers('accelData') > 0;
  if (subscribe !== simply.state.accel.subscribe) {
    return simply.accelConfig(subscribe, true);
  }
};

/**
 * The accelerometer configuration parameter for {@link simply.accelConfig}.
 * The accelerometer data stream is useful for applications such as gesture recognition when accelTap is too limited.
 * However, keep in mind that smaller batch sample sizes and faster rates will drastically impact the battery life of both the Pebble and phone because of the taxing use of the processors and Bluetooth modules.
 * @typedef {object} simply.accelConf
 * @property {number} [rate] - The rate accelerometer data points are generated in hertz. Valid values are 10, 25, 50, and 100. Initializes as 100.
 * @property {number} [samples] - The number of accelerometer data points to accumulate in a batch before calling the event handler. Valid values are 1 to 25 inclusive. Initializes as 25.
 * @property {boolean} [subscribe] - Whether to subscribe to accelerometer data events. {@link simply.accelPeek} cannot be used when subscribed. Simply.js will automatically (un)subscribe for you depending on the amount of accelData handlers registered.
 */

/**
 * Changes the accelerometer configuration.
 * See {@link simply.accelConfig}
 * @memberOf simply
 * @param {simply.accelConfig} accelConf - An object defining the accelerometer configuration.
 */
simply.accelConfig = function(opt, auto) {
  var accelState = simply.state.accel;
  if (typeof opt === 'undefined') {
    return {
      rate: accelState.rate,
      samples: accelState.samples,
      subscribe: accelState.subscribe,
    };
  } else if (typeof opt === 'boolean') {
    opt = { subscribe: opt };
  }
  for (var k in opt) {
    if (k === 'subscribe') {
      accelState.subscribeMode = opt[k] && !auto ? 'manual' : 'auto';
    }
    accelState[k] = opt[k];
  }
  return simply.impl.accelConfig.apply(this, arguments);
};

/**
 * Peeks at the current accelerometer values.
 * @memberOf simply
 * @param {simply.eventHandler} callback - A callback function that will be provided the accel data point as an event.
 */
simply.accelPeek = function(callback) {
  if (simply.state.accel.subscribe) {
    throw Error('Cannot use accelPeek when listening to accelData events');
  }
  return simply.impl.accelPeek.apply(this, arguments);
};

/**
 * Simply.js event. See all the possible event types. Subscribe to events using {@link simply.on}.
 * @typedef simply.event
 * @see simply.clickEvent
 * @see simply.accelTapEvent
 * @see simply.accelDataEvent
 */

/**
 * Simply.js button click event. This can either be a single click or long click.
 * Use the event type 'singleClick' or 'longClick' to subscribe to these events.
 * @typedef simply.clickEvent
 * @property {string} button - The button that was pressed: 'back', 'up', 'select', or 'down'. This is also the event subtype.
 */

simply.emitClick = function(type, button) {
  simply.emit(type, button, {
    button: button,
  });
};

/**
 * Simply.js accel tap event.
 * Use the event type 'accelTap' to subscribe to these events.
 * @typedef simply.accelTapEvent
 * @property {string} axis - The axis the tap event occurred on: 'x', 'y', or 'z'. This is also the event subtype.
 * @property {number} direction - The direction of the tap along the axis: 1 or -1.
 */

simply.emitAccelTap = function(axis, direction) {
  simply.emit('accelTap', axis, {
    axis: axis,
    direction: direction,
  });
};

/**
 * Simply.js accel data point.
 * Typical values for gravity is around -1000 on the z axis.
 * @typedef simply.accelPoint
 * @property {number} x - The acceleration across the x-axis.
 * @property {number} y - The acceleration across the y-axis.
 * @property {number} z - The acceleration across the z-axis.
 * @property {boolean} vibe - Whether the watch was vibrating when measuring this point.
 * @property {number} time - The amount of ticks in millisecond resolution when measuring this point.
 */

/**
 * Simply.js accel data event.
 * Use the event type 'accelData' to subscribe to these events.
 * @typedef simply.accelDataEvent
 * @property {number} samples - The number of accelerometer samples in this event.
 * @property {simply.accelPoint} accel - The first accel in the batch. This is provided for convenience.
 * @property {simply.accelPoint[]} accels - The accelerometer samples in an array.
 */

simply.emitAccelData = function(accels, callback) {
  var e = {
    samples: accels.length,
    accel: accels[0],
    accels: accels,
  };
  if (callback) {
    return callback(e);
  }
  simply.emit('accelData', e);
};

return simply;

})();

Pebble.require = require;
var require = simply.require;
