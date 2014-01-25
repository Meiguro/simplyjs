/**
 * Simply.js
 * @namespace simply
 */
var simply = (function() {

var commands = [{
  name: 'setText',
  params: [{
    name: 'title',
  }, {
    name: 'subtitle',
  }, {
    name: 'body',
  }, {
    name: 'clear',
  }],
}, {
  name: 'singleClick',
  params: [{
    name: 'button',
  }],
}, {
  name: 'longClick',
  params: [{
    name: 'button',
  }],
}, {
  name: 'accelTap',
  params: [{
    name: 'axis',
  }, {
    name: 'direction',
  }],
}, {
  name: 'vibe',
  params: [{
    name: 'type',
  }],
}, {
  name: 'setScrollable',
  params: [{
    name: 'scrollable',
  }],
}, {
  name: 'setStyle',
  params: [{
    name: 'type',
  }],
}];

var commandMap = {};

for (var i = 0, ii = commands.length; i < ii; ++i) {
  var command = commands[i];
  commandMap[command.name] = command;
  command.id = i;

  var params = command.params;
  if (!params) {
    continue;
  }

  var paramMap = command.paramMap = {};
  for (var j = 0, jj = params.length; j < jj; ++j) {
    var param = params[j];
    paramMap[param.name] = param;
    param.id = j + 1;
  }
}

var buttons = [
  'back',
  'up',
  'select',
  'down',
];

var accelAxes = [
  'x',
  'y',
  'z',
];

var vibeTypes = [
  'short',
  'long',
  'double',
];

var styleTypes = [
  'small',
  'large',
  'mono',
];

var simply = {};

simply.state = {};
simply.packages = {};
simply.listeners = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

var wrapHandler = function(handler, level) {
  setHandlerPath(handler, null, level || 1);
  var package = simply.packages[handler.path];
  if (package) {
    return simply.protect(package.fwrap(handler), handler.path);
  } else {
    return simply.protect(handler, handler.path);
  }
};

simply.init = function() {
  if (simply.inited) {
    simply.loadMainScript();
    return;
  }

  ajax.onHandler = function(type, handler) {
    return wrapHandler(handler, 2);
  };

  simply.inited = true;

  simply.loadMainScript();
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

var setHandlerPath = function(handler, path, level) {
  handler.path = path || getExceptionScope(new Error(), (level || 0) + 2) || simply.basename();
  return handler;
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
  handler = wrapHandler(handler);
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

var getExecPackage = function(execName) {
  var packages = simply.packages;
  for (var path in packages) {
    var package = packages[path];
    if (package && package.execName === execName) {
      return path;
    }
  }
};

var getExceptionFile = function(e, level) {
  var stack = e.stack.split('\n');
  for (var i = level || 0, ii = stack.length; i < ii; ++i) {
    var line = stack[i];
    if (line.match(/^\$\d/)) {
      var path = getExecPackage(line);
      if (path) {
        return path;
      }
    }
  }
  return stack[level];
};

var getExceptionScope = function(e, level) {
  var stack = e.stack.split('\n');
  for (var i = level || 0, ii = stack.length; i < ii; ++i) {
    var line = stack[i];
    if (!line || line.match('native code')) { continue; }
    return line.match(/^\$\d/) && getExecPackage(line) || line;
  }
  return stack[level];
};

simply.papply = function(f, args, path) {
  try {
    return f.apply(this, args);
  } catch (e) {
    console.log(e.line + ': ' + e + '\n' + e.stack);
    simply.text({
      subtitle: !path && getExceptionFile(e) || getExecPackage(path) || path,
      body: e.line + ' ' + e.message,
    }, true);
    simply.state.run = false;
  }
};

simply.protect = function(f, path) {
  return function() {
    return simply.papply(f, arguments, path);
  };
};

simply.defun = function(fn, fargs, fbody) {
  if (!fbody) {
    fbody = fargs;
    fargs = [];
  }
  return new Function('return function ' + fn + '(' + fargs.join(', ') + ') {' + fbody + '}')();
};

var toSafeName = function(name) {
  name = name.replace(/[^0-9A-Za-z_$]/g, '_');
  if (name.match(/^[0-9]/)) {
    name = '_' + name;
  }
  return name;
};

simply.execScript = function(script, path) {
  if (!simply.state.run) {
    return;
  }
  return simply.papply(function() {
    return simply.defun(path, script)();
  }, null, path);
};

simply.loadScript = function(scriptUrl, path, async) {
  console.log('loading: ' + scriptUrl);

  if (typeof path === 'string' && !path.match(/^[^\/]*\/\//)) {
    path = path.replace(simply.basepath(), '');
  }
  var saveName = 'script:' + path;

  path = path || simply.basename();
  var execName = '$' + simply.state.numPackages++ + toSafeName(path);
  var fapply = simply.defun(execName, ['f, args'], 'return f.apply(this, args)');
  var fwrap = function(f) { return function() { return fapply(f, arguments); }; };
  simply.packages[path] = {
    execName: execName,
    fapply: fapply,
    fwrap: fwrap,
  };

  var result;
  var useScript = function(data) {
    return (result = simply.packages[path].value = simply.execScript(data, execName));
  };

  ajax({ url: scriptUrl, cache: false, async: async }, function(data) {
    if (data && data.length) {
      localStorage.setItem(saveName, data);
      useScript(data);
    }
  }, function(data, status) {
    data = localStorage.getItem(saveName);
    if (data && data.length) {
      console.log(status + ': failed, loading saved script instead');
      useScript(data);
    }
  });

  return result;
};

simply.loadScriptUrl = function(scriptUrl) {
  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }

  if (scriptUrl) {
    simply.loadScript(scriptUrl, null, false);
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
  return simply.loadScript(basepath + path, path, false);
};

simply.onWebViewClosed = function(e) {
  if (!e.response) {
    return;
  }

  var options = JSON.parse(decodeURIComponent(e.response));
  simply.loadScriptUrl(options.scriptUrl);
};

simply.getOptions = function() {
  return {
    scriptUrl: localStorage.getItem('mainJsUrl'),
  };
};

simply.onShowConfiguration = function(e) {
  var options = encodeURIComponent(JSON.stringify(simply.getOptions()));
  Pebble.openURL(simply.settingsUrl + '#' + options);
};

function makePacket(command, def) {
  var packet = {};
  packet[0] = command.id;
  if (def) {
    var paramMap = command.paramMap;
    for (var k in def) {
      packet[paramMap[k].id] = def[k];
    }
  }
  return packet;
}

simply.sendPacket = function(packet) {
  if (!simply.state.run) {
    return;
  }
  var send;
  send = function() {
    Pebble.sendAppMessage(packet, util2.void, send);
  };
  send();
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
  var command = commandMap.setText;
  var packetDef = {};
  for (var k in textDef) {
    packetDef[k] = textDef[k].toString();
  }
  var packet = makePacket(command, packetDef);
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
  }
  simply.sendPacket(packet);
};

simply.setText = simply.text;

simply.setTextField = function(field, text, clear) {
  var command = commandMap.setText;
  var packet = makePacket(command);
  var param = command.paramMap[field];
  if (param) {
    packet[param.id] = text.toString();
  }
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
  }
  simply.sendPacket(packet);
};

/**
 * Sets the title field. The title field is the first and largest text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.title = function(text, clear) {
  simply.setTextField('title', text, clear);
};

/**
 * Sets the subtitle field. The subtitle field is the second large text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */
simply.subtitle = function(text, clear) {
  simply.setTextField('subtitle', text, clear);
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
  simply.setTextField('body', text, clear);
};

/**
 * Vibrates the Pebble.
 * There are three support vibe types: short, long, and double.
 * @memberOf simply
 * @param {string} [type] - The vibe type. Defaults to short.
 */
simply.vibe = function(type) {
  var command = commandMap.vibe;
  var packet = makePacket(command);
  var vibeIndex = vibeTypes.indexOf(type);
  packet[command.paramMap.type.id] = vibeIndex !== -1 ? vibeIndex : 0;
  simply.sendPacket(packet);
};

/**
 * Enable scrolling in the Pebble UI.
 * When scrolling is enabled, up and down button presses are no longer forwarded to JavaScript handlers.
 * Single select, long select, and accel tap events are still available to you however.
 * @memberOf simply
 * @param {boolean} scrollable - Whether to enable a scrollable view.
 */

simply.scrollable = function(scrollable) {
  if (scrollable === null) {
    return simply.state.scrollable === true;
  }
  simply.state.scrollable = scrollable;

  var command = commandMap.setScrollable;
  var packet = makePacket(command);
  packet[command.paramMap.scrollable.id] = scrollable ? 1 : 0;
  simply.sendPacket(packet);
};

simply.style = function(type) {
  var command = commandMap.setStyle;
  var packet = makePacket(command);
  var styleIndex = styleTypes.indexOf(type);
  packet[command.paramMap.type.id] = styleIndex !== -1 ? styleIndex : 1;
  simply.sendPacket(packet);
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

simply.onAppMessage = function(e) {
  var payload = e.payload;
  var code = payload[0];
  var command = commands[code];

  switch (command.name) {
    case 'singleClick':
    case 'longClick':
      var button = buttons[payload[1]];
      simply.emit(command.name, button, {
        button: button,
      });
      break;
    case 'accelTap':
      var axis = accelAxes[payload[1]];
      simply.emit(command.name, axis, {
        axis: axis,
        direction: payload[2],
      });
  }
};

Pebble.addEventListener('showConfiguration', simply.onShowConfiguration);
Pebble.addEventListener('webviewclosed', simply.onWebViewClosed);
Pebble.addEventListener('appmessage', simply.onAppMessage);

return simply;

})();

var require = simply.require;
