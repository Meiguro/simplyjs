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

/* Make JSHint happy */
if (typeof Image === 'undefined') {
  window.Image = function(){};
}

/**
 * First part of this file is defining the commands and types that we will use later.
 */

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

var setWindowParams = [{
  name: 'clear',
}, {
  name: 'id',
}, {
  name: 'pushing',
  type: Boolean,
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
  name: 'actionBackgroundColor',
  type: Color,
}, {
  name: 'backgroundColor',
  type: Color,
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
  name: 'image',
  type: Image,
}, {
  name: 'style'
}]);

var setMenuParams = setWindowParams.concat([{
  name: 'sections',
  type: Number,
}]);

var setStageParams = setWindowParams;

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
    type: Image,
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
  } else if (param.type === Image && typeof v !== 'number') {
    v = ImageService.resolve(v);
  } else if (typeof param.type === 'function') {
    v = param.type(v);
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

SimplyPebble.sendPacket = (function() {
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

  function send(packet) {
    queue.push(packet);
    if (sending) { return; }
    sending = true;
    cycle();
  }

  return send;
})();

SimplyPebble.buttonConfig = function(buttonConf) {
  var command = commandMap.configButtons;
  var packet = makePacket(command, buttonConf);
  SimplyPebble.sendPacket(packet);
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

var setActionPacket = function(packet, command, actionDef) {
  if (actionDef) {
    if (typeof actionDef === 'boolean') {
      actionDef = { action: actionDef };
    }
    setPacket(packet, command, actionDef, actionBarTypeMap);
  }
  return packet;
};

SimplyPebble.window = function(windowDef, clear) {
  var command = commandMap.setWindow;
  var packet = makePacket(command, windowDef);
  if (clear) {
    clear = toClearFlags(clear);
    packet[command.paramMap.clear.id] = clear;
  }
  setActionPacket(packet, command, windowDef.action);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.windowHide = function(windowId) {
  var command = commandMap.windowHide;
  var packet = makePacket(command);
  packet[command.paramMap.id.id] = windowId;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.card = function(cardDef, clear, pushing) {
  var command = commandMap.setCard;
  var packet = makePacket(command, cardDef);
  if (clear) {
    clear = toClearFlags(clear);
    packet[command.paramMap.clear.id] = clear;
  }
  if (pushing) {
    packet[command.paramMap.pushing.id] = pushing;
  }
  setActionPacket(packet, command, cardDef.action);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.vibe = function(type) {
  var command = commandMap.vibe;
  var packet = makePacket(command);
  var vibeIndex = vibeTypes.indexOf(type);
  packet[command.paramMap.type.id] = vibeIndex !== -1 ? vibeIndex : 0;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.accelConfig = function(configDef) {
  var command = commandMap.configAccelData;
  var packet = makePacket(command, configDef);
  SimplyPebble.sendPacket(packet);
};

var accelListeners = [];

SimplyPebble.accelPeek = function(callback) {
  accelListeners.push(callback);
  var command = commandMap.getAccelData;
  var packet = makePacket(command);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.menu = function(menuDef, clear, pushing) {
  var command = commandMap.setMenu;
  var packetDef = util2.copy(menuDef);
  if (packetDef.sections instanceof Array) {
    packetDef.sections = packetDef.sections.length;
  }
  if (!packetDef.sections) {
    packetDef.sections = 1;
  }
  var packet = makePacket(command, packetDef);
  if (clear) {
    clear = toClearFlags(clear);
    packet[command.paramMap.clear.id] = clear;
  }
  if (pushing) {
    packet[command.paramMap.pushing.id] = pushing;
  }
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.menuSection = function(sectionIndex, sectionDef, clear) {
  var command = commandMap.setMenuSection;
  var packetDef = util2.copy(sectionDef);
  packetDef.section = sectionIndex;
  if (packetDef.items instanceof Array) {
    packetDef.items = packetDef.items.length;
  }
  packetDef.clear = clear;
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

SimplyPebble.stage = function(stageDef, clear, pushing) {
  var command = commandMap.setStage;
  var packet = makePacket(command, stageDef);
  if (clear) {
    clear = toClearFlags(clear);
    packet[command.paramMap.clear.id] = clear;
  }
  if (pushing) {
    packet[command.paramMap.pushing.id] = pushing;
  }
  setActionPacket(packet, command, stageDef.action);
  SimplyPebble.sendPacket(packet);
};

var toFramePacket = function(packetDef) {
  if (packetDef.position) {
    var position = packetDef.position;
    delete packetDef.position;
    packetDef.x = position.x;
    packetDef.y = position.y;
  }
  if (packetDef.size) {
    var size = packetDef.size;
    delete packetDef.size;
    packetDef.width = size.x;
    packetDef.height = size.y;
  }
  return packetDef;
};

SimplyPebble.stageElement = function(elementId, elementType, elementDef, index) {
  var command = commandMap.stageElement;
  var packetDef = util2.copy(elementDef);
  packetDef.id = elementId;
  packetDef.type = elementType;
  packetDef.index = index;
  packetDef = toFramePacket(packetDef);
  var packet = makePacket(command, packetDef);
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.stageRemove = function(elementId) {
  var command = commandMap.stageRemove;
  var packet = makePacket(command);
  packet[command.paramMap.id.id] = elementId;
  SimplyPebble.sendPacket(packet);
};

SimplyPebble.stageAnimate = function(elementId, animateDef, duration, easing) {
  var command = commandMap.stageAnimate;
  var packetDef = util2.copy(animateDef);
  packetDef.id = elementId;
  if (duration) {
    packetDef.duration = duration;
  }
  if (easing) {
    packetDef.easing = easing;
  }
  packetDef = toFramePacket(packetDef);
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
