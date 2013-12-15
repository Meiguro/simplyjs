var simply = (function() {

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

simply = {};

simply.listeners = {};

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
        button: buttons[payload[1]]
      });
      break;
  }
};

return simply;

})();
