var simply = (function() {

var localStorage = window.localStorage;

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

simply = {};

simply.state = {};

simply.listeners = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  if (simply.inited) {
    return;
  }

  Pebble.addEventListener('showConfiguration', simply.onShowConfiguration);
  Pebble.addEventListener('webviewclosed', simply.onWebViewClosed);
  Pebble.addEventListener('appmessage', simply.onAppMessage);
  simply.inited = true;

  simply.loadScriptUrl();
};

simply.begin = function() {
};

simply.reset = function() {
  simply.state = {};
  simply.off();
};

simply.on = function(type, subtype, handler) {
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  var typeMap = simply.listeners;
  var subtypeMap = (typeMap[type] || ( typeMap[type] = {} ));
  (subtypeMap[subtype] || ( subtypeMap[subtype] = [] )).push(handler);
};

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
  if (index !== -1) {
    return;
  }
  handlers.splice(index, 1);
};

simply.emitToHandlers = function(type, handlers, e) {
  if (!handlers) {
    return;
  }
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    if (handlers[i](e, type, i) === false) {
      return true;
    }
  }
  return false;
}

simply.emit = function(type, subtype, e) {
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

simply.eval = function(script) {
  simply.reset();
  eval(script);
  simply.begin();
};

simply.loadScript = function(scriptUrl) {
  console.log('loading: ' + scriptUrl);
  ajax({ url: scriptUrl }, function(data) {
    if (data && data.length) {
      localStorage.setItem('mainJs', data);
      simply.eval(data);
    }
  }, function(data, status) {
    data = localStorage.getItem('mainJs');
    if (data && data.length) {
      console.log(status + ': failed, loading saved script instead');
      simply.eval(data);
    }
  });
};

simply.loadScriptUrl = function(scriptUrl) {
  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }

  if (scriptUrl) {
    simply.loadScript(scriptUrl);
  }
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
  var send; (send = function() {
    Pebble.sendAppMessage(packet, util2.void, send);
  })();
}

simply.setText = function(textDef, clear) {
  var command = commandMap.setText;
  var packet = makePacket(command, textDef);
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
  }
  simply.sendPacket(packet);
};

simply.text = simply.setText;

simply.setTextField = function(field, text, clear) {
  var command = commandMap.setText;
  var packet = makePacket(command);
  var param = command.paramMap[field];
  if (param) {
    packet[param.id] = text;
  }
  if (clear) {
    packet[command.paramMap.clear.id] = 1;
  }
  simply.sendPacket(packet);
};

simply.title = function(text, clear) {
  simply.setTextField('title', text, clear);
};

simply.subtitle = function(text, clear) {
  simply.setTextField('subtitle', text, clear);
};

simply.body = function(text, clear) {
  simply.setTextField('body', text, clear);
};

simply.vibe = function(type) {
  var command = commandMap.vibe;
  var packet = makePacket(command);
  var vibeIndex = vibeTypes.indexOf(type);
  packet[command.paramMap.type.id] = vibeIndex !== -1 ? vibeIndex : 0;
  simply.sendPacket(packet);
};

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

return simply;

})();
