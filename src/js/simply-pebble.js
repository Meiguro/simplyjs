var simply = require('simply');
var util2 = require('util2');

var SimplyPebble = {};

if (typeof Image === 'undefined') {
  window.Image = function(){};
}

var setWindowParams = [{
  name: 'clear',
  type: Boolean,
}, {
  name: 'id',
}, {
  name: 'action',
  type: Boolean,
}, {
  name: 'actionUp',
  type: Image,
}, {
  name: 'actionSelect',
  type: Image,
}, {
  name: 'actionDown',
  type: Image,
}, {
  name: 'fullscreen',
  type: Boolean,
}, {
  name: 'scrollable',
  type: Boolean,
}];

var setCardParams = setWindowParams.concat([{
  name: 'title',
  type: String,
}, {
  name: 'subtitle',
  type: String,
}, {
  name: 'body',
  type: String,
}, {
  name: 'icon',
  type: Image,
}, {
  name: 'subicon',
  type: Image,
}, {
  name: 'banner',
  type: Image,
}, {
  name: 'style',
  type: Boolean,
}]);

var commands = [{
  name: 'setWindow',
  params: setWindowParams,
}, {
  name: 'windowShow',
  params: [{
    name: 'id'
  }]
}, {
  name: 'windowHide',
  params: [{
    name: 'id'
  }]
}, {
  name: 'setCard',
  params: setCardParams,
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
  name: 'accelData',
  params: [{
    name: 'transactionId',
  }, {
    name: 'numSamples',
  }, {
    name: 'accelData',
  }],
}, {
  name: 'getAccelData',
  params: [{
    name: 'transactionId',
  }],
}, {
  name: 'configAccelData',
  params: [{
    name: 'rate',
  }, {
    name: 'samples',
  }, {
    name: 'subscribe',
  }],
}, {
  name: 'configButtons',
  params: [{
    name: 'back',
  }, {
    name: 'up',
  }, {
    name: 'select',
  }, {
    name: 'down',
  }],
}, {
  name: 'setMenu',
  params: [{
    name: 'id',
  }, {
    name: 'sections',
  }],
}, {
  name: 'setMenuSection',
  params: [{
    name: 'section',
  }, {
    name: 'items',
  }, {
    name: 'title',
    type: String,
  }],
}, {
  name: 'getMenuSection',
  params: [{
    name: 'section',
  }],
}, {
  name: 'setMenuItem',
  params: [{
    name: 'section',
  }, {
    name: 'item',
  }, {
    name: 'title',
    type: String,
  }, {
    name: 'subtitle',
    type: String,
  }, {
    name: 'image',
    type: Image,
  }],
}, {
  name: 'getMenuItem',
  params: [{
    name: 'section',
  }, {
    name: 'item',
  }],
}, {
  name: 'menuSelect',
  params: [{
    name: 'section',
  }, {
    name: 'item',
  }],
}, {
  name: 'menuLongSelect',
  params: [{
    name: 'section',
  }, {
    name: 'item',
  }],
}, {
  name: 'image',
  params: [{
    name: 'id',
  }, {
    name: 'width',
  }, {
    name: 'height',
  }, {
    name: 'pixels',
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

var clearFlagMap = {
  action: (1 << 0),
  text: (1 << 1),
  image: (1 << 2),
};

var actionBarTypeMap = {
  up: 'actionUp',
  select: 'actionSelect',
  down: 'actionDown',
};

var SimplyPebble = {};

SimplyPebble.init = function() {
  simply.impl = SimplyPebble;
  simply.init();
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

var setHandlerPath = function(handler, path, level) {
  var level0 = 4; // caller -> wrap -> apply -> wrap -> set
  handler.path = path || getExceptionScope(new Error(), (level || 0) + level0) || simply.basename();
  return handler;
};

var papply = function(f, args, path) {
  try {
    return f.apply(this, args);
  } catch (e) {
    var scope = !path && getExceptionFile(e) || getExecPackage(path) || path;
    console.log(scope + ':' + e.line + ': ' + e + '\n' + e.stack);
    simply.text({
      subtitle: scope,
      body: e.line + ' ' + e.message,
    }, true);
    simply.state.run = false;
  }
};

var protect = function(f, path) {
  return function() {
    return papply(f, arguments, path);
  };
};

SimplyPebble.wrapHandler = function(handler, level) {
  if (!handler) { return; }
  setHandlerPath(handler, null, level || 1);
  var package = simply.packages[handler.path];
  if (package) {
    return protect(package.fwrap(handler), handler.path);
  } else {
    return protect(handler, handler.path);
  }
};

var toSafeName = function(name) {
  name = name.replace(/[^0-9A-Za-z_$]/g, '_');
  if (name.match(/^[0-9]/)) {
    name = '_' + name;
  }
  return name;
};

SimplyPebble.loadPackage = function(pkg, loader) {
  pkg.execName = '$' + simply.state.numPackages++ + toSafeName(pkg.name);
  pkg.fapply = simply.defun(pkg.execName, ['f', 'args'], 'return f.apply(this, args)');
  pkg.fwrap = function(f) { return function() { return pkg.fapply(f, arguments); }; };

  return papply(loader, null, pkg.name);
};

SimplyPebble.onShowConfiguration = function(e) {
  simply.openSettings(e);
};

SimplyPebble.onWebViewClosed = function(e) {
  simply.closeSettings(e);
};

var toParam = function(param, v) {
  if (param.type === String) {
    v = v.toString();
  } else if (param.type === Boolean) {
    v = v ? 1 : 0;
  } else if (param.type === Image && typeof v !== 'number') {
    v = simply.image(v);
  }
  return v;
};

var setPacket = function(packet, command, def, typeMap) {
  var paramMap = command.paramMap;
  for (var k in def) {
    var paramName = typeMap && typeMap[k] || k;
    if (!paramName) { continue; }
    var param = paramMap[paramName];
    if (param) {
      packet[param.id] = toParam(param, def[k]);
    }
  }
  return packet;
};

var makePacket = function(command, def) {
  var packet = {};
  packet[0] = command.id;
  if (def) {
    setPacket(packet, command, def);
  }
  return packet;
};

SimplyPebble.sendPacket = function(packet) {
  if (!simply.state.run) {
    return;
  }
  var send;
  send = function() {
    Pebble.sendAppMessage(packet, util2.noop, send);
  };
  send();
};

SimplyPebble.setMenu = function() {
  SimplyPebble.sendPacket(makePacket(commandMap.setMenu));
};

SimplyPebble.buttonConfig = function(buttonConf) {
  var command = commandMap.configButtons;
  var packet = makePacket(command, buttonConf);
  SimplyPebble.sendPacket(packet);
};

var toClearFlags = function(clear) {
  if (clear === 'all') {
    clear = ~0;
  } else if (typeof clear === 'string') {
    clear = clearFlagMap[clear];
  } else if (typeof clear === 'object') {
    var flags = 0;
    for (var k in clear) {
      if (clear[k] === true) {
        flags |= clearFlagMap[k];
      }
    }
    clear = flags;
  }
  return clear;
};

SimplyPebble.window = function(windowDef, clear) {
  clear = toClearFlags(clear);
  var command = commandMap.setWindow;
  var packet = makePacket(command, windowDef);
  if (clear) {
    packet[command.paramMap.clear.id] = clear;
  }
  var actionDef = windowDef.action;
  if (actionDef) {
    if (typeof actionDef === 'boolean') {
      actionDef = { action: actionDef };
    }
    setPacket(packet, command, actionDef, actionBarTypeMap);
  }
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.card = function(cardDef, clear) {
  clear = toClearFlags(clear);
  var command = commandMap.setCard;
  var packet = makePacket(command, cardDef);
  if (clear) {
    packet[command.paramMap.clear.id] = clear;
  }
  var actionDef = cardDef.action;
  if (actionDef) {
    if (typeof actionDef === 'boolean') {
      actionDef = { action: actionDef };
    }
    setPacket(packet, command, actionDef, actionBarTypeMap);
  }
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.textfield = function(field, text, clear) {
  var command = commandMap.setCard;
  var packet = makePacket(command);
  var param = command.paramMap[field];
  if (param) {
    packet[param.id] = text.toString();
  }
  if (clear) {
    packet[command.paramMap.clear.id] = true;
  }
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.vibe = function(type) {
  var command = commandMap.vibe;
  var packet = makePacket(command);
  var vibeIndex = vibeTypes.indexOf(type);
  packet[command.paramMap.type.id] = vibeIndex !== -1 ? vibeIndex : 0;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.scrollable = function(scrollable) {
  var command = commandMap.window;
  var packet = makePacket(command);
  packet[command.paramMap.scrollable.id] = scrollable ? 1 : 0;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.fullscreen = function(fullscreen) {
  var command = commandMap.window;
  var packet = makePacket(command);
  packet[command.paramMap.fullscreen.id] = fullscreen ? 1 : 0;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.style = function(type) {
  var command = commandMap.card;
  var packet = makePacket(command);
  var styleIndex = styleTypes.indexOf(type);
  packet[command.paramMap.type.id] = styleIndex !== -1 ? styleIndex : 1;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.accelConfig = function(configDef) {
  var command = commandMap.configAccelData;
  var packet = makePacket(command, configDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.accelPeek = function(callback) {
  simply.state.accel.listeners.push(callback);
  var command = commandMap.getAccelData;
  var packet = makePacket(command);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.menu = function(menuDef) {
  var command = commandMap.setMenu;
  var packetDef = util2.copy(menuDef);
  if (packetDef.sections instanceof Array) {
    packetDef.sections = packetDef.sections.length;
  }
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.menuSection = function(sectionIndex, sectionDef) {
  var command = commandMap.setMenuSection;
  var packetDef = util2.copy(sectionDef);
  packetDef.section = sectionIndex;
  if (packetDef.items instanceof Array) {
    packetDef.items = packetDef.items.length;
  }
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.menuItem = function(sectionIndex, itemIndex, itemDef) {
  var command = commandMap.setMenuItem;
  var packetDef = util2.copy(itemDef);
  packetDef.section = sectionIndex;
  packetDef.item = itemIndex;
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.image = function(id, gbitmap) {
  var command = commandMap.image;
  var packetDef = util2.copy(gbitmap);
  packetDef.id = id;
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

var readInt = function(packet, width, pos, signed) {
  var value = 0;
  pos = pos || 0;
  for (var i = 0; i < width; ++i) {
    value += (packet[pos + i] & 0xFF) << (i * 8);
  }
  if (signed) {
    var mask = 1 << (width * 8 - 1);
    if (value & mask) {
      value = value - (((mask - 1) << 1) + 1);
    }
  }
  return value;
};

SimplyPebble.onAppMessage = function(e) {
  var payload = e.payload;
  var code = payload[0];
  var command = commands[code];

  switch (command.name) {
    case 'singleClick':
    case 'longClick':
      var button = buttons[payload[1]];
      simply.emitClick(command.name, button);
      break;
    case 'accelTap':
      var axis = accelAxes[payload[1]];
      simply.emitAccelTap(axis, payload[2]);
      break;
    case 'accelData':
      var transactionId = payload[1];
      var samples = payload[2];
      var data = payload[3];
      var accels = [];
      for (var i = 0; i < samples; i++) {
        var pos = i * 15;
        var accel = {
          x: readInt(data, 2, pos, true),
          y: readInt(data, 2, pos + 2, true),
          z: readInt(data, 2, pos + 4, true),
          vibe: readInt(data, 1, pos + 6) ? true : false,
          time: readInt(data, 8, pos + 7),
        };
        accels[i] = accel;
      }
      if (typeof transactionId === 'undefined') {
        simply.emitAccelData(accels);
      } else {
        var handlers = simply.state.accel.listeners;
        simply.state.accel.listeners = [];
        for (var j = 0, jj = handlers.length; j < jj; ++j) {
          simply.emitAccelData(accels, handlers[j]);
        }
      }
      break;
    case 'getMenuSection':
      simply.emitMenuSection(payload[1]);
      break;
    case 'getMenuItem':
      simply.emitMenuItem(payload[1], payload[2]);
      break;
    case 'menuSelect':
    case 'menuLongSelect':
      simply.emitMenuSelect(command.name, payload[1], payload[2]);
      break;
  }
};

Pebble.addEventListener('showConfiguration', SimplyPebble.onShowConfiguration);
Pebble.addEventListener('webviewclosed', SimplyPebble.onWebViewClosed);
Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

module.exports = SimplyPebble;
