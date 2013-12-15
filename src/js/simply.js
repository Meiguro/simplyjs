var simply = (function() {

var commands = [{
  name: 'setText',
  params: [{
    name: 'field',
  }, {
    name: 'text',
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
