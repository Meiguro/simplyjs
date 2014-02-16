/* global simply */

var SimplyPebble = (function() {

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
}, {
  name: 'setFullscreen',
  params: [{
    name: 'fullscreen',
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

SimplyPebble.papply = function(f, args, path) {
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

SimplyPebble.protect = function(f, path) {
  return function() {
    return SimplyPebble.papply(f, arguments, path);
  };
};

SimplyPebble.wrapHandler = function(handler, level) {
  if (!handler) { return; }
  setHandlerPath(handler, null, level || 1);
  var package = simply.packages[handler.path];
  if (package) {
    return SimplyPebble.protect(package.fwrap(handler), handler.path);
  } else {
    return SimplyPebble.protect(handler, handler.path);
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

  return SimplyPebble.papply(loader, null, pkg.name);
};

SimplyPebble.onWebViewClosed = function(e) {
  if (!e.response) {
    return;
  }

  var options = JSON.parse(decodeURIComponent(e.response));
  simply.loadMainScript(options.scriptUrl);
};

SimplyPebble.getOptions = function() {
  return {
    scriptUrl: localStorage.getItem('mainJsUrl'),
  };
};

SimplyPebble.onShowConfiguration = function(e) {
  var options = encodeURIComponent(JSON.stringify(SimplyPebble.getOptions()));
  Pebble.openURL(simply.settingsUrl + '#' + options);
};

function makePacket(command, def) {
  var packet = {};
  packet[0] = command.id;
  if (def) {
    var paramMap = command.paramMap;
    for (var k in def) {
      var param = paramMap[k];
      if (param) {
        packet[param.id] = def[k];
      }
    }
  }
  return packet;
}

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

SimplyPebble.buttonConfig = function(buttonConf) {
  var command = commandMap.configButtons;
  var packet = makePacket(command, buttonConf);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.text = function(textDef, clear) {
  var command = commandMap.setText;
  var packetDef = {};
  for (var k in textDef) {
    packetDef[k] = textDef[k].toString();
  }
  var packet = makePacket(command, packetDef);
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
  }
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.textfield = function(field, text, clear) {
  var command = commandMap.setText;
  var packet = makePacket(command);
  var param = command.paramMap[field];
  if (param) {
    packet[param.id] = text.toString();
  }
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
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
  if (scrollable === null) {
    return simply.state.scrollable === true;
  }
  simply.state.scrollable = scrollable;

  var command = commandMap.setScrollable;
  var packet = makePacket(command);
  packet[command.paramMap.scrollable.id] = scrollable ? 1 : 0;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.fullscreen = function(fullscreen) {
  if (fullscreen === null) {
    return simply.state.fullscreen === true;
  }
  simply.state.fullscreen = fullscreen;

  var command = commandMap.setFullscreen;
  var packet = makePacket(command);
  packet[command.paramMap.fullscreen.id] = fullscreen ? 1 : 0;
  SimplyPebble.sendPacket(packet);
}

SimplyPebble.style = function(type) {
  var command = commandMap.setStyle;
  var packet = makePacket(command);
  var styleIndex = styleTypes.indexOf(type);
  packet[command.paramMap.type.id] = styleIndex !== -1 ? styleIndex : 1;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.accelConfig = function(configDef) {
  var command = commandMap.configAccelData;
  var packetDef = {};
  for (var k in configDef) {
    packetDef[k] = configDef[k];
  }
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.accelPeek = function(callback) {
  simply.state.accel.listeners.push(callback);
  var command = commandMap.getAccelData;
  var packet = makePacket(command);
  SimplyPebble.sendPacket(packet);
};

readInt = function(packet, width, pos, signed) {
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
        for (var i = 0, ii = handlers.length; i < ii; ++i) {
          simply.emitAccelData(accels, handlers[i]);
        }
      }
      break;
  }
};

Pebble.addEventListener('showConfiguration', SimplyPebble.onShowConfiguration);
Pebble.addEventListener('webviewclosed', SimplyPebble.onWebViewClosed);
Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

return SimplyPebble;

})();
