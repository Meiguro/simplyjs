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

simply = {};

simply.listeners = {};

simply.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

simply.init = function() {
  Pebble.addEventListener('showConfiguration', simply.onShowConfiguration);
  Pebble.addEventListener('webviewclosed', simply.onWebViewClosed);
  simply.loadScriptUrl();
};

simply.begin = function() {
  Pebble.addEventListener('appmessage', simply.onAppMessage);
};

simply.on = function(type, success) {
  var map = simply.listeners;
  return (map[type] || ( map[type] = [] )).push(success);
};

simply.emit = function(type, e) {
  var map = simply.listeners;
  var handlers = map[type];
  if (!handlers) {
    return;
  }

  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    if (handlers[i](e, type, i) == false) {
      return true;
    }
  }

  return false;
};

simply.loadScript = function(scriptUrl) {
  console.log('loading: ' + scriptUrl);
  ajax({ url: scriptUrl }, function(data) {
    if (data && data.length) {
      localStorage.setItem('mainJs', data);
      eval(data);
    }
  }, function(data, status) {
    data = localStorage.getItem('mainJs');
    if (data && data.length) {
      console.log(status + ': failed, loading saved script instead');
      eval(data);
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

function makePacket(type, def) {
  var packet = {};
  var command = commandMap[type];
  packet[0] = command.id;
  var paramMap = command.paramMap;
  for (var k in def) {
    packet[paramMap[k].id] = def[k];
  }
  return packet;
}

simply.setText = function(textDef) {
  var packet = makePacket('setText', textDef);
  var send; (send = function() {
    Pebble.sendAppMessage(packet, util2.void, send);
  })();
};

simply.onAppMessage = function(e) {
  var payload = e.payload;
  var code = payload[0];
  var command = commands[code];

  switch (command.name) {
    case 'singleClick':
    case 'longClick':
      simply.emit(command.name, {
        button: buttons[payload[1]],
      });
      break;
    case 'accelTap':
      simply.emit(command.name, {
        axis: accelAxes[payload[1]],
        direction: payload[2],
      });
  }
};

return simply;

})();
