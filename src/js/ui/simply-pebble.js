var struct = require('struct');
var util2 = require('util2');
var myutil = require('myutil');
var Resource = require('ui/resource');
var Accel = require('ui/accel');
var ImageService = require('ui/imageservice');
var WindowStack = require('ui/windowstack');
var Window = require('ui/window');
var Menu = require('ui/menu');
var StageElement = require('ui/element');

var simply = require('ui/simply');

/**
 * This package provides the underlying implementation for the ui/* classes.
 *
 * This implementation uses PebbleKit JS AppMessage to send commands to a Pebble Watch.
 */

/**
 * First part of this file is defining the commands and types that we will use later.
 */

var BoolType = function(x) {
  return x ? 1 : 0;
};

var ImageType = function(x) {
  if (typeof x !== 'number') {
    return ImageService.resolve(x);
  }
  return x;
};

var Color = function(x) {
  switch (x) {
    case 'clear': return ~0;
    case 'black': return 0;
    case 'white': return 1;
  }
  return Number(x);
};

var Font = function(x) {
  var id = Resource.getId(x);
  if (id) {
    return id;
  }
  x = myutil.toCConstantName(x);
  if (!x.match(/^RESOURCE_ID/)) {
    x = 'RESOURCE_ID_' + x;
  }
  x = x.replace(/_+/g, '_');
  return x;
};

var TextOverflowMode = function(x) {
  switch (x) {
    case 'wrap'    : return 0;
    case 'ellipsis': return 1;
    case 'fill'    : return 2;
  }
  return Number(x);
};

var TextAlignment = function(x) {
  switch (x) {
    case 'left'  : return 0;
    case 'center': return 1;
    case 'right' : return 2;
  }
  return Number(x);
};

var TimeUnits = function(x) {
  var z = 0;
  x = myutil.toObject(x, true);
  for (var k in x) {
    switch (k) {
      case 'seconds': z |= (1 << 0); break;
      case 'minutes': z |= (1 << 1); break;
      case 'hours'  : z |= (1 << 2); break;
      case 'days'   : z |= (1 << 3); break;
      case 'months' : z |= (1 << 4); break;
      case 'years'  : z |= (1 << 5); break;
    }
  }
  return z;
};

var CompositingOp = function(x) {
  switch (x) {
    case 'assign':
    case 'normal': return 0;
    case 'assignInverted':
    case 'invert': return 1;
    case 'or'    : return 2;
    case 'and'   : return 3;
    case 'clear' : return 4;
    case 'set'   : return 5;
  }
  return Number(x);
};

var AnimationCurve = function(x) {
  switch (x) {
    case 'linear'   : return 0;
    case 'easeIn'   : return 1;
    case 'easeOut'  : return 2;
    case 'easeInOut': return 3;
  }
  return Number(x);
};

var makeArrayType = function(types) {
  return function(x) {
    var index = types.indexOf(x);
    if (index !== -1) {
      return index;
    }
    return Number(x);
  };
};

var windowTypes = [
  'window',
  'menu',
  'card',
];

var WindowType = makeArrayType(windowTypes);

var Packet = new struct([
  ['uint16', 'type'],
  ['uint16', 'length'],
]);

var WindowShowPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'type', WindowType],
  ['bool', 'pushing', BoolType],
]);

var WindowHidePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var WindowPropsPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'backgroundColor', Color],
  ['bool', 'fullscreen', BoolType],
  ['bool', 'scrollable', BoolType],
]);

var WindowActionBarPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'upImage'],
  ['uint32', 'selectImage'],
  ['uint32', 'downImage'],
]);

var CommandPackets = [
  Packet,
  WindowShowPacket,
  WindowHidePacket,
  WindowPropsPacket,
  WindowActionBarPacket,
];

var setCardParams = [{
  name: 'clear',
}, {
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
  type: ImageType,
}, {
  name: 'subicon',
  type: ImageType,
}, {
  name: 'image',
  type: ImageType,
}, {
  name: 'style'
}];

var setMenuParams = [{
  name: 'clear',
}, {
  name: 'sections',
  type: Number,
}];

var setStageParams = [{
  name: 'clear',
}];

var commands = [{
  name: 'setWindow',
}, {
  name: 'windowShow',
}, {
  name: 'windowHide',
}, {
  name: 'setCard',
  params: setCardParams,
}, {
  name: 'click',
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
  params: setMenuParams,
}, {
  name: 'setMenuSection',
  params: [{
    name: 'clear',
    type: Boolean,
  }, {
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
    name: 'icon',
    type: ImageType,
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
}, {
  name: 'setStage',
  params: setStageParams,
}, {
  name: 'stageElement',
  params: [{
    name: 'id',
  }, {
    name: 'type',
  }, {
    name: 'index',
  }, {
    name: 'x',
  }, {
    name: 'y',
  }, {
    name: 'width',
  }, {
    name: 'height',
  }, {
    name: 'backgroundColor',
    type: Color,
  }, {
    name: 'borderColor',
    type: Color,
  }, {
    name: 'radius',
  }, {
    name: 'text',
    type: String,
  }, {
    name: 'font',
    type: Font,
  }, {
    name: 'color',
    type: Color,
  }, {
    name: 'textOverflow',
    type: TextOverflowMode,
  }, {
    name: 'textAlign',
    type: TextAlignment,
  }, {
    name: 'updateTimeUnits',
    type: TimeUnits,
  }, {
    name: 'image',
    type: ImageType,
  }, {
    name: 'compositing',
    type: CompositingOp,
  }],
}, {
  name: 'stageRemove',
  params: [{
    name: 'id',
  }],
}, {
  name: 'stageAnimate',
  params: [{
    name: 'id',
  }, {
    name: 'x',
  }, {
    name: 'y',
  }, {
    name: 'width',
  }, {
    name: 'height',
  }, {
    name: 'duration',
  }, {
    name: 'easing',
    type: AnimationCurve,
  }],
}, {
  name: 'stageAnimateDone',
  params: [{
    name: 'index',
  }],
}];

// Build the commandMap and map each command to an integer.

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
  backgroundColor: 'actionBackgroundColor',
};


/**
 * SimplyPebble object provides the actual methods to communicate with Pebble.
 *
 * It's an implementation of an abstract interface used by all the other classes.
 */

var SimplyPebble = {};

SimplyPebble.init = function() {
  // Register listeners for app message communication
  Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

  // Register this implementation as the one currently in use
  simply.impl = SimplyPebble;
};


var toParam = function(param, v) {
  if (param.type === String) {
    v = typeof v !== 'undefined' ? v.toString() : '';
  } else if (param.type === Boolean) {
    v = v ? 1 : 0;
  } else if (typeof param.type === 'function') {
    v = param.type(v);
  }
  return v;
};

var setMessage = function(message, command, def, typeMap) {
  var paramMap = command.paramMap;
  for (var k in def) {
    var paramName = typeMap && typeMap[k] || k;
    if (!paramName) { continue; }
    var param = paramMap[paramName];
    if (param) {
      message[param.id] = toParam(param, def[k]);
    }
  }
  return message;
};

var makeMessage = function(command, def) {
  var message = {};
  message[0] = command.id;
  if (def) {
    setMessage(message, command, def);
  }
  return message;
};

SimplyPebble.sendMessage = (function() {
  var queue = [];
  var sending = false;

  function stop() {
    sending = false;
  }

  function consume() {
    queue.splice(0, 1);
    if (queue.length === 0) { return stop(); }
    cycle();
  }

  function cycle() {
    var head = queue[0];
    if (!head) { return stop(); }
    Pebble.sendAppMessage(head, consume, cycle);
  }

  function send(message) {
    queue.push(message);
    if (sending) { return; }
    sending = true;
    cycle();
  }

  return send;
})();

var toByteArray = function(packet) {
  var size = Math.max(packet.size, packet._cursor);
  packet.packetType(CommandPackets.indexOf(packet));
  packet.packetLength(size);

  var byteArray = new Array(size);
  var dataView = packet._view;
  for (var i = 0; i < size; ++i) {
    byteArray[i] = dataView.getUint8(i);
  }

  return byteArray;
};

SimplyPebble.sendPacket = function(packet) {
  SimplyPebble.sendMessage({ 0: toByteArray(packet) });
};

var setPacket = function(packet, def) {
  packet._fields.forEach(function(field) {
    if (field.name in def) {
      packet[field.name](def[field.name]);
    }
  });
  return packet;
};

SimplyPebble.windowProps = function(def) {
  SimplyPebble.sendPacket(setPacket(WindowPropsPacket, def));
};

SimplyPebble.windowActionBar = function(def) {
  SimplyPebble.sendPacket(setPacket(WindowActionBarPacket, def));
};

SimplyPebble.windowShow = function(def) {
  SimplyPebble.sendPacket(setPacket(WindowShowPacket, def));
};

SimplyPebble.windowHide = function(id) {
  SimplyPebble.sendPacket(WindowHidePacket.id(id));
};

SimplyPebble.buttonConfig = function(buttonConf) {
  var command = commandMap.configButtons;
  var message = makeMessage(command, buttonConf);
  SimplyPebble.sendMessage(message);
};

var toClearFlags = function(clear) {
  if (clear === true) {
    clear = 'all';
  }
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

var setActionMessage = function(message, command, actionDef) {
  if (actionDef) {
    if (typeof actionDef === 'boolean') {
      actionDef = { action: actionDef };
    }
    setMessage(message, command, actionDef, actionBarTypeMap);
  }
  return message;
};

SimplyPebble.card = function(cardDef, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'card', pushing: pushing });
  }
  SimplyPebble.windowProps(cardDef);
  var command = commandMap.setCard;
  var message = makeMessage(command, cardDef);
  if (clear) {
    clear = toClearFlags(clear);
    message[command.paramMap.clear.id] = clear;
  }
  setActionMessage(message, command, cardDef.action);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.vibe = function(type) {
  var command = commandMap.vibe;
  var message = makeMessage(command);
  var vibeIndex = vibeTypes.indexOf(type);
  message[command.paramMap.type.id] = vibeIndex !== -1 ? vibeIndex : 0;
  SimplyPebble.sendMessage(message);
};

SimplyPebble.accelConfig = function(configDef) {
  var command = commandMap.configAccelData;
  var message = makeMessage(command, configDef);
  SimplyPebble.sendMessage(message);
};

var accelListeners = [];

SimplyPebble.accelPeek = function(callback) {
  accelListeners.push(callback);
  var command = commandMap.getAccelData;
  var message = makeMessage(command);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.menu = function(menuDef, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'menu', pushing: pushing });
  }
  SimplyPebble.windowProps(menuDef);
  var command = commandMap.setMenu;
  var messageDef = util2.copy(menuDef);
  if (messageDef.sections instanceof Array) {
    messageDef.sections = messageDef.sections.length;
  }
  if (!messageDef.sections) {
    messageDef.sections = 1;
  }
  var message = makeMessage(command, messageDef);
  if (clear) {
    clear = toClearFlags(clear);
    message[command.paramMap.clear.id] = clear;
  }
  SimplyPebble.sendMessage(message);
};

SimplyPebble.menuSection = function(sectionIndex, sectionDef, clear) {
  var command = commandMap.setMenuSection;
  var messageDef = util2.copy(sectionDef);
  messageDef.section = sectionIndex;
  if (messageDef.items instanceof Array) {
    messageDef.items = messageDef.items.length;
  }
  messageDef.clear = clear;
  var message = makeMessage(command, messageDef);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.menuItem = function(sectionIndex, itemIndex, itemDef) {
  var command = commandMap.setMenuItem;
  var messageDef = util2.copy(itemDef);
  messageDef.section = sectionIndex;
  messageDef.item = itemIndex;
  var message = makeMessage(command, messageDef);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.image = function(id, gbitmap) {
  var command = commandMap.image;
  var messageDef = util2.copy(gbitmap);
  messageDef.id = id;
  var message = makeMessage(command, messageDef);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.stage = function(stageDef, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'window', pushing: pushing });
  }
  SimplyPebble.windowProps(stageDef);
  var command = commandMap.setStage;
  var message = makeMessage(command, stageDef);
  if (clear) {
    clear = toClearFlags(clear);
    message[command.paramMap.clear.id] = clear;
  }
  setActionMessage(message, command, stageDef.action);
  SimplyPebble.sendMessage(message);
};

var toFrameMessage = function(messageDef) {
  if (messageDef.position) {
    var position = messageDef.position;
    delete messageDef.position;
    messageDef.x = position.x;
    messageDef.y = position.y;
  }
  if (messageDef.size) {
    var size = messageDef.size;
    delete messageDef.size;
    messageDef.width = size.x;
    messageDef.height = size.y;
  }
  return messageDef;
};

SimplyPebble.stageElement = function(elementId, elementType, elementDef, index) {
  var command = commandMap.stageElement;
  var messageDef = util2.copy(elementDef);
  messageDef.id = elementId;
  messageDef.type = elementType;
  messageDef.index = index;
  messageDef = toFrameMessage(messageDef);
  var message = makeMessage(command, messageDef);
  SimplyPebble.sendMessage(message);
};

SimplyPebble.stageRemove = function(elementId) {
  var command = commandMap.stageRemove;
  var message = makeMessage(command);
  message[command.paramMap.id.id] = elementId;
  SimplyPebble.sendMessage(message);
};

SimplyPebble.stageAnimate = function(elementId, animateDef, duration, easing) {
  var command = commandMap.stageAnimate;
  var messageDef = util2.copy(animateDef);
  messageDef.id = elementId;
  if (duration) {
    messageDef.duration = duration;
  }
  if (easing) {
    messageDef.easing = easing;
  }
  messageDef = toFrameMessage(messageDef);
  var message = makeMessage(command, messageDef);
  SimplyPebble.sendMessage(message);
};

var readInt = function(message, width, pos, signed) {
  var value = 0;
  pos = pos || 0;
  for (var i = 0; i < width; ++i) {
    value += (message[pos + i] & 0xFF) << (i * 8);
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

  if (!command) {
    console.log('Received unknown payload: ' + JSON.stringify(payload));
    return;
  }

  switch (command.name) {
    case 'windowHide':
      WindowStack.emitHide(payload[1]);
      break;
    case 'click':
    case 'longClick':
      var button = buttons[payload[1]];
      Window.emitClick(command.name, button);
      break;
    case 'accelTap':
      var axis = accelAxes[payload[1]];
      Accel.emitAccelTap(axis, payload[2]);
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
        Accel.emitAccelData(accels);
      } else {
        var handlers = accelListeners;
        accelListeners = [];
        for (var j = 0, jj = handlers.length; j < jj; ++j) {
          Accel.emitAccelData(accels, handlers[j]);
        }
      }
      break;
    case 'getMenuSection':
      Menu.emitSection(payload[1]);
      break;
    case 'getMenuItem':
      Menu.emitItem(payload[1], payload[2]);
      break;
    case 'menuSelect':
    case 'menuLongSelect':
      Menu.emitSelect(command.name, payload[1], payload[2]);
      break;
    case 'stageAnimateDone':
      StageElement.emitAnimateDone(payload[1]);
      break;
  }
};

module.exports = SimplyPebble;
