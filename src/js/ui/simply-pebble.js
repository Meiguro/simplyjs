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
 * This implementation uses PebbleKit JS AppMessage to send commands to a Pebble Watm */

/**
 * First part of this file is defining the commands and types that we will use later.
 */

var BoolType = function(x) {
  return x ? 1 : 0;
};

var StringType = function(x) {
  return x || '';
};

var EnumerableType = function(x) {
  if (x && x.hasOwnProperty('length')) {
    return x.length;
  }
  return x ? Number(x) : 0;
};

var ImageType = function(x) {
  if (x && typeof x !== 'number') {
    return ImageService.resolve(x);
  }
  return x ? Number(x) : 0;
};

var PositionType = function(x) {
  this.positionX(x.x);
  this.positionY(x.y);
};

var SizeType = function(x) {
  this.sizeW(x.x);
  this.sizeH(x.y);
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

var MenuRowAlign = function(x) {
  switch(x) {
    case 'none'   : return 0;
    case 'center' : return 1;
    case 'top'    : return 2;
    case 'bottom' : return 3;
  }
  return x ? Number(x) : 0;
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

var makeFlagsType = function(types) {
  return function(x) {
    var z = 0;
    for (var k in x) {
      if (!x[k]) { continue; }
      var index = types.indexOf(k);
      if (index !== -1) {
        z |= 1 << index;
      }
    }
    return z;
  };
};

var windowTypes = [
  'window',
  'menu',
  'card',
];

var WindowType = makeArrayType(windowTypes);

var buttonTypes = [
  'back',
  'up',
  'select',
  'down',
];

var ButtonType = makeArrayType(buttonTypes);

var ButtonFlagsType = makeFlagsType(buttonTypes);

var cardTextTypes = [
  'title',
  'subtitle',
  'body',
];

var CardTextType = makeArrayType(cardTextTypes);

var cardImageTypes = [
  'icon',
  'subicon',
  'banner',
];

var CardImageType = makeArrayType(cardImageTypes);

var cardStyleTypes = [
  'small',
  'large',
  'mono',
];

var CardStyleType = makeArrayType(cardStyleTypes);

var vibeTypes = [
  'short',
  'long',
  'double',
];

var VibeType = makeArrayType(vibeTypes);

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

var WindowButtonConfigPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'buttonMask', ButtonFlagsType],
]);

var WindowActionBarPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'up', ImageType],
  ['uint32', 'select', ImageType],
  ['uint32', 'down', ImageType],
  ['uint8', 'action', BoolType],
]);

var CardClearPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'flags'],
]);

var CardTextPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'index', CardTextType],
  ['cstring', 'text'],
]);

var CardImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'image', ImageType],
  ['uint8', 'index', CardImageType],
]);

var CardStylePacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'style', CardStyleType],
]);

var VibePacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'type', VibeType],
]);

var AccelPeekPacket = new struct([
  [Packet, 'packet'],
]);

var AccelConfigPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'samples'],
  ['uint8', 'rate'],
  ['bool', 'subscribe', BoolType],
]);

var MenuClearPacket = new struct([
  [Packet, 'packet'],
]);

var MenuClearSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
]);

var MenuPropsPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'sections', EnumerableType],
]);

var MenuSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'items', EnumerableType],
  ['uint16', 'titleLength', EnumerableType],
  ['cstring', 'title', StringType],
]);

var MenuItemPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
  ['uint32', 'icon', ImageType],
  ['uint16', 'titleLength', EnumerableType],
  ['uint16', 'subtitleLength', EnumerableType],
  ['cstring', 'title', StringType],
  ['cstring', 'subtitle', StringType],
]);

var MenuGetSelectionPacket = new struct([
  [Packet, 'packet'],
]);

var MenuSetSelectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
  ['uint8', 'align', MenuRowAlign],
  ['bool', 'animated', BoolType],
]);

var StageClearPacket = new struct([
  [Packet, 'packet'],
]);

var ElementInsertPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'type'],
  ['uint16', 'index'],
]);

var ElementRemovePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var GPoint = new struct([
  ['int16', 'x'],
  ['int16', 'y'],
]);

var GSize = new struct([
  ['int16', 'w'],
  ['int16', 'h'],
]);

var GRect = new struct([
  [GPoint, 'origin', PositionType],
  [GSize, 'size', SizeType],
]);

var ElementCommonPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  [GPoint, 'position', PositionType],
  [GSize, 'size', SizeType],
  ['uint8', 'backgroundColor', Color],
  ['uint8', 'borderColor', Color],
]);

var ElementRadiusPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint16', 'radius', EnumerableType],
]);

var ElementTextPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'updateTimeUnits', TimeUnits],
  ['cstring', 'text', StringType],
]);

var ElementTextStylePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'color', Color],
  ['uint8', 'textOverflow', TextOverflowMode],
  ['uint8', 'textAlign', TextAlignment],
  ['uint32', 'customFont'],
  ['cstring', 'systemFont', StringType],
]);

var ElementImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint32', 'image', ImageType],
  ['uint8', 'compositing', CompositingOp],
]);

var CommandPackets = [
  Packet,
  WindowShowPacket,
  WindowHidePacket,
  WindowPropsPacket,
  WindowButtonConfigPacket,
  WindowActionBarPacket,
  CardClearPacket,
  CardTextPacket,
  CardImagePacket,
  CardStylePacket,
  VibePacket,
  AccelPeekPacket,
  AccelConfigPacket,
  MenuClearPacket,
  MenuClearSectionPacket,
  MenuPropsPacket,
  MenuSectionPacket,
  MenuItemPacket,
  MenuGetSelectionPacket,
  MenuSetSelectionPacket,
  StageClearPacket,
  ElementInsertPacket,
  ElementRemovePacket,
  ElementCommonPacket,
  ElementRadiusPacket,
  ElementTextPacket,
  ElementTextStylePacket,
  ElementImagePacket,
];

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
}, {
  name: 'configAccelData',
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
}, {
  name: 'setMenuSection',
}, {
  name: 'getMenuSection',
  params: [{
    name: 'section',
  }],
}, {
  name: 'setMenuItem',
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
  name: 'menuSelection',
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
}, {
  name: 'stageRemove',
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

var accelAxes = [
  'x',
  'y',
  'z',
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

var menuSelectionTypeMap = {
  section: 'selectionSection',
  item: 'selectionItem',
  align: 'selectionAlign',
  animated: 'selectionAnimated',
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
  var type = CommandPackets.indexOf(packet);
  var size = Math.max(packet._size, packet._cursor);
  packet.packetType(type);
  packet.packetLength(size);

  var buffer = packet._view;
  var byteArray = new Array(size);
  for (var i = 0; i < size; ++i) {
    byteArray[i] = buffer.getUint8(i);
  }

  return byteArray;
};

SimplyPebble.sendPacket = function(packet) {
  SimplyPebble.sendMessage({ 0: toByteArray(packet) });
};

SimplyPebble.windowProps = function(def) {
  SimplyPebble.sendPacket(WindowPropsPacket.prop(def));
};

SimplyPebble.windowButtonConfig = function(def) {
  SimplyPebble.sendPacket(WindowButtonConfigPacket.buttonMask(def));
};

var toActionDef = function(actionDef) {
  if (typeof actionDef === 'boolean') {
    actionDef = { action: actionDef };
  }
  return actionDef;
};

SimplyPebble.windowActionBar = function(def) {
  SimplyPebble.sendPacket(WindowActionBarPacket.prop(toActionDef(def)));
};

SimplyPebble.windowShow = function(def) {
  SimplyPebble.sendPacket(WindowShowPacket.prop(def));
};

SimplyPebble.windowHide = function(id) {
  SimplyPebble.sendPacket(WindowHidePacket.id(id));
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

SimplyPebble.cardClear = function(clear) {
  SimplyPebble.sendPacket(CardClearPacket.flags(toClearFlags(clear)));
};

SimplyPebble.cardText = function(field, text) {
  SimplyPebble.sendPacket(CardTextPacket.index(field).text(text));
};

SimplyPebble.cardImage = function(field, image) {
  SimplyPebble.sendPacket(CardImagePacket.index(field).image(image));
};

SimplyPebble.card = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'card', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyPebble.cardClear(clear);
  }
  SimplyPebble.windowProps(def);
  if (def.action !== undefined) {
    SimplyPebble.windowActionBar(def.action);
  }
  for (var k in def) {
    if (cardTextTypes.indexOf(k) !== -1) {
      SimplyPebble.cardText(k, def[k]);
    } else if (cardImageTypes.indexOf(k) !== -1) {
      SimplyPebble.cardImage(k, def[k]);
    }
  }
};

SimplyPebble.vibe = function(type) {
  SimplyPebble.sendPacket(VibePacket.type(type));
};

var accelListeners = [];

SimplyPebble.accelPeek = function(callback) {
  accelListeners.push(callback);
  SimplyPebble.sendPacket(AccelPeekPacket);
};

SimplyPebble.accelConfig = function(def) {
  SimplyPebble.sendPacket(AccelConfigPacket.prop(def));
};

SimplyPebble.menuClear = function() {
  SimplyPebble.sendPacket(MenuClearPacket);
};

SimplyPebble.menuClearSection = function(section) {
  SimplyPebble.sendPacket(MenuClearSectionPacket.section(section));
};

SimplyPebble.menuProps = function(def) {
  SimplyPebble.sendPacket(MenuPropsPacket.prop(def));
};

SimplyPebble.menuSection = function(section, def, clear) {
  if (clear !== undefined) {
    SimplyPebble.menuClearSection(section);
  }
  MenuSectionPacket
    .section(section)
    .items(def.items)
    .titleLength(def.title)
    .title(def.title);
  SimplyPebble.sendPacket(MenuSectionPacket);
};

SimplyPebble.menuItem = function(section, item, def) {
  MenuItemPacket
    .section(section)
    .item(item)
    .icon(def.icon)
    .titleLength(def.title)
    .subtitleLength(def.subtitle)
    .title(def.title)
    .subtitle(def.subtitle);
  SimplyPebble.sendPacket(MenuItemPacket);
};

SimplyPebble.menuSelection = function(section, item) {
  if (arguments.length === 0) {
    SimplyPebble.sendPacket(MenuGetSelectionPacket);
  }
  SimplyPebble.sendPacket(MenuSetSelectionPacket.section(section).item(item));
};

SimplyPebble.menu = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'menu', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyPebble.menuClear();
  }
  SimplyPebble.windowProps(def);
  SimplyPebble.menuProps(def);
};

SimplyPebble.elementInsert = function(id, type, index) {
  SimplyPebble.sendPacket(ElementInsertPacket.id(id).type(type).index(index));
};

SimplyPebble.elementRemove = function(id) {
  SimplyPebble.sendPacket(ElementRemovePacket.id(id));
};

SimplyPebble.elementCommon = function(id, def) {
  ElementCommonPacket
    .id(id)
    .position(def.position)
    .size(def.size)
    .prop(def);
  SimplyPebble.sendPacket(ElementCommonPacket);
};

SimplyPebble.elementRadius = function(id, radius) {
  SimplyPebble.sendPacket(ElementRadiusPacket.id(id).radius(radius));
};

SimplyPebble.elementText = function(id, text, timeUnits) {
  SimplyPebble.sendPacket(ElementTextPacket.id(id).updateTimeUnits(timeUnits).text(text));
};

SimplyPebble.elementTextStyle = function(id, def) {
  ElementTextStylePacket.id(id).prop(def);
  var font = Font(def.font);
  if (typeof font === 'number') {
    ElementTextStylePacket.customFont(font).systemFont('');
  } else {
    ElementTextStylePacket.customFont(0).systemFont(font);
  }
  SimplyPebble.sendPacket(ElementTextStylePacket);
};

SimplyPebble.elementImage = function(id, image, compositing) {
  SimplyPebble.sendPacket(ElementImagePacket.id(id).image(image).compositing(compositing));
};

SimplyPebble.stageClear = function() {
  SimplyPebble.sendPacket(StageClearPacket);
};

SimplyPebble.stageElement = function(id, type, def, index) {
  if (index !== undefined) {
    SimplyPebble.elementInsert(id, type, index);
  }
  SimplyPebble.elementCommon(id, def);
  switch (type) {
    case StageElement.RectType:
    case StageElement.CircleType:
      SimplyPebble.elementRadius(id, def.radius);
      break;
    case StageElement.TextType:
      SimplyPebble.elementRadius(id, def.radius);
      SimplyPebble.elementTextStyle(id, def);
      SimplyPebble.elementText(id, def.text, def.updateTimeUnits);
      break;
    case StageElement.ImageType:
      SimplyPebble.elementRadius(id, def.radius);
      SimplyPebble.elementImage(id, def.image, def.compositing);
      break;
  }
};

SimplyPebble.stageRemove = SimplyPebble.elementRemove;

SimplyPebble.stage = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'window', pushing: pushing });
  }
  SimplyPebble.windowProps(def);
  if (clear !== undefined) {
    SimplyPebble.stageClear();
  }
  if (def.action !== undefined) {
    SimplyPebble.windowActionBar(def.action);
  }
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

SimplyPebble.image = function(id, gbitmap) {
  var command = commandMap.image;
  var messageDef = util2.copy(gbitmap);
  messageDef.id = id;
  var message = makeMessage(command, messageDef);
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
      var button = buttonTypes[payload[1]];
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
    case 'menuSelection':
      Menu.emitSelect(command.name, payload[1], payload[2]);
      break;
    case 'stageAnimateDone':
      StageElement.emitAnimateDone(payload[1]);
      break;
  }
};

module.exports = SimplyPebble;
