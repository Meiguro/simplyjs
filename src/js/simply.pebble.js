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
    console.log(scope + ':' + e.line + ': ' + e + e.stack);
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

SimplyPebble.defun = function(fn, fargs, fbody) {
  if (!fbody) {
    fbody = fargs;
    fargs = [];
  }
  return new Function('return function ' + fn + '(' + fargs.join(', ') + ') {' + fbody + '}')();
};

SimplyPebble.execScript = function(script, path) {
  if (!simply.state.run) {
    return;
  }
  return SimplyPebble.papply(function() {
    return SimplyPebble.defun(path, script)();
  }, null, path);
};

var toSafeName = function(name) {
  name = name.replace(/[^0-9A-Za-z_$]/g, '_');
  if (name.match(/^[0-9]/)) {
    name = '_' + name;
  }
  return name;
};

SimplyPebble.loadScript = function(scriptUrl, path, async) {
  console.log('loading: ' + scriptUrl);

  if (typeof path === 'string' && !path.match(/^[^\/]*\/\//)) {
    path = path.replace(simply.basepath(), '');
  }
  var saveName = 'script:' + path;

  path = path || simply.basename();
  var execName = '$' + simply.state.numPackages++ + toSafeName(path);
  var fapply = SimplyPebble.defun(execName, ['f, args'], 'return f.apply(this, args)');
  var fwrap = function(f) { return function() { return fapply(f, arguments); }; };
  simply.packages[path] = {
    execName: execName,
    fapply: fapply,
    fwrap: fwrap,
  };

  var result;
  var useScript = function(data) {
    return (result = simply.packages[path].value = SimplyPebble.execScript(data, execName));
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

SimplyPebble.onWebViewClosed = function(e) {
  if (!e.response) {
    return;
  }

  var options = JSON.parse(decodeURIComponent(e.response));
  simply.loadScriptUrl(options.scriptUrl);
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
      packet[paramMap[k].id] = def[k];
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
    Pebble.sendAppMessage(packet, util2.void, send);
  };
  send();
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
  }
};

Pebble.addEventListener('showConfiguration', SimplyPebble.onShowConfiguration);
Pebble.addEventListener('webviewclosed', SimplyPebble.onWebViewClosed);
Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

return SimplyPebble;

})();
