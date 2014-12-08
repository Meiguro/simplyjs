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

var StringType = function(x) {
  return '' + x;
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

var WindowShowEventPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var WindowHideEventPacket = new struct([
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
  ['uint8', 'backgroundColor', Color],
]);

var ClickPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'button', ButtonType],
]);

var LongClickPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'button', ButtonType],
]);

var ImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['int16', 'width'],
  ['int16', 'height'],
  ['data', 'pixels'],
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

var AccelData = new struct([
  ['int16', 'x'],
  ['int16', 'y'],
  ['int16', 'z'],
  ['bool', 'vibe'],
  ['uint64', 'time'],
]);

var AccelDataPacket = new struct([
  [Packet, 'packet'],
  ['bool', 'peek'],
  ['uint8', 'samples'],
]);

var AccelTapPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'axis'],
  ['int8', 'direction'],
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

var MenuGetSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
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

var MenuGetItemPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuSelectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
  ['uint8', 'align', MenuRowAlign],
  ['bool', 'animated', BoolType],
]);

var MenuGetSelectionPacket = new struct([
  [Packet, 'packet'],
]);

var MenuSelectionEventPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuSelectPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuLongSelectPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
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

var ElementAnimatePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  [GPoint, 'position', PositionType],
  [GSize, 'size', SizeType],
  ['uint32', 'duration'],
  ['uint8', 'easing', AnimationCurve],
]);

var ElementAnimateDonePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var CommandPackets = [
  Packet,
  WindowShowPacket,
  WindowHidePacket,
  WindowShowEventPacket,
  WindowHideEventPacket,
  WindowPropsPacket,
  WindowButtonConfigPacket,
  WindowActionBarPacket,
  ClickPacket,
  LongClickPacket,
  ImagePacket,
  CardClearPacket,
  CardTextPacket,
  CardImagePacket,
  CardStylePacket,
  VibePacket,
  AccelPeekPacket,
  AccelConfigPacket,
  AccelDataPacket,
  AccelTapPacket,
  MenuClearPacket,
  MenuClearSectionPacket,
  MenuPropsPacket,
  MenuSectionPacket,
  MenuGetSectionPacket,
  MenuItemPacket,
  MenuGetItemPacket,
  MenuSelectionPacket,
  MenuGetSelectionPacket,
  MenuSelectionEventPacket,
  MenuSelectPacket,
  MenuLongSelectPacket,
  StageClearPacket,
  ElementInsertPacket,
  ElementRemovePacket,
  ElementCommonPacket,
  ElementRadiusPacket,
  ElementTextPacket,
  ElementTextStylePacket,
  ElementImagePacket,
  ElementAnimatePacket,
  ElementAnimateDonePacket,
];

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

/**
 * SimplyPebble object provides the actual methods to communicate with Pebble.
 *
 * It's an implementation of an abstract interface used by all the other classes.
 */

var state;

var SimplyPebble = {};

SimplyPebble.init = function() {
  // Register listeners for app message communication
  Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

  // Register this implementation as the one currently in use
  simply.impl = SimplyPebble;

  state = SimplyPebble.state = {};

  // Initialize the app message queue
  state.messageQueue = new MessageQueue();

  // Initialize the packet queue
  state.packetQueue = new PacketQueue();
};

/**
 * MessageQueue is an app message queue that guarantees delivery and order.
 */
var MessageQueue = function() {
  this._queue = [];
  this._sending = false;

  this._consume = this.consume.bind(this);
  this._cycle = this.cycle.bind(this);
};

MessageQueue.prototype.stop = function() {
  this._sending = false;
};

MessageQueue.prototype.consume = function() {
  this._queue.splice(0, 1);
  if (this._queue.length === 0) {
    return this.stop();
  }
  this.cycle();
};

MessageQueue.prototype.cycle = function() {
  if (!this._sending) {
    return;
  }
  var head = this._queue[0];
  if (!head) {
    return this.stop();
  }
  Pebble.sendAppMessage(head, this._consume, this._cycle);
};

MessageQueue.prototype.send = function(message) {
  this._queue.push(message);
  if (this._sending) {
    return;
  }
  this._sending = true;
  this.cycle();
};

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

/**
 * PacketQueue is a packet queue that combines multiple packets into a single packet.
 * This reduces latency caused by the time spacing between each app message.
 */
var PacketQueue = function() {
  this._message = [];

  this._send = this.send.bind(this);
};

PacketQueue.prototype._maxPayloadSize = 2048 - 20;

PacketQueue.prototype.add = function(packet) {
  var byteArray = toByteArray(packet);
  if (this._message.length + byteArray.length >= this._maxPayloadSize) {
    this.send();
  }
  Array.prototype.push.apply(this._message, byteArray);
  clearTimeout(this._timeout);
  this._timeout = setTimeout(this._send, 0);
};

PacketQueue.prototype.send = function() {
  state.messageQueue.send({ 0: this._message });
  this._message = [];
};

SimplyPebble.sendPacket = function(packet) {
  state.packetQueue.add(packet);
};

SimplyPebble.windowShow = function(def) {
  SimplyPebble.sendPacket(WindowShowPacket.prop(def));
};

SimplyPebble.windowHide = function(id) {
  SimplyPebble.sendPacket(WindowHidePacket.id(id));
};

SimplyPebble.windowProps = function(def, backgroundColor) {
  WindowPropsPacket
    .prop(def)
    .backgroundColor(backgroundColor);
  SimplyPebble.sendPacket(WindowPropsPacket);
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
  var actionDef = toActionDef(def);
  WindowActionBarPacket
    .up(actionDef.up)
    .select(actionDef.select)
    .down(actionDef.down)
    .action(typeof def === 'boolean' ? def : true)
    .backgroundColor(actionDef.backgroundColor || 'black');
  SimplyPebble.sendPacket(WindowActionBarPacket);
};

SimplyPebble.image = function(id, gbitmap) {
  SimplyPebble.sendPacket(ImagePacket.id(id).prop(gbitmap));
};

var toClearFlags = function(clear) {
  if (clear === true || clear === 'all') {
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
  SimplyPebble.sendPacket(CardTextPacket.index(field).text(text || ''));
};

SimplyPebble.cardImage = function(field, image) {
  SimplyPebble.sendPacket(CardImagePacket.index(field).image(image));
};

SimplyPebble.cardStyle = function(field, style) {
  SimplyPebble.sendPacket(CardStylePacket.style(style));
};

SimplyPebble.card = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'card', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyPebble.cardClear(clear);
  }
  SimplyPebble.windowProps(def, 'white');
  if (def.action !== undefined) {
    SimplyPebble.windowActionBar(def.action);
  }
  for (var k in def) {
    if (cardTextTypes.indexOf(k) !== -1) {
      SimplyPebble.cardText(k, def[k]);
    } else if (cardImageTypes.indexOf(k) !== -1) {
      SimplyPebble.cardImage(k, def[k]);
    } else if (k === 'style') {
      SimplyPebble.cardStyle(k, def[k]);
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

SimplyPebble.menuSelection = function(section, item, align) {
  if (section === undefined) {
    SimplyPebble.sendPacket(MenuGetSelectionPacket);
    return;
  }
  SimplyPebble.sendPacket(MenuSelectionPacket.section(section).item(item).align(align || 'center'));
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

SimplyPebble.elementAnimate = function(id, def, animateDef, duration, easing) {
  ElementAnimatePacket
    .id(id)
    .position(animateDef.position || def.position)
    .size(animateDef.size || def.size)
    .duration(duration)
    .easing(easing);
  SimplyPebble.sendPacket(ElementAnimatePacket);
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

SimplyPebble.stageAnimate = SimplyPebble.elementAnimate;

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

SimplyPebble.window = SimplyPebble.stage;

var toArrayBuffer = function(array, length) {
  length = length || array.length;
  var copy = new DataView(new ArrayBuffer(length));
  for (var i = 0; i < length; ++i) {
    copy.setUint8(i, array[i]);
  }
  return copy;
};

SimplyPebble.onPacket = function(buffer, offset) {
  Packet._view = buffer;
  Packet._offset = offset;
  var packet = CommandPackets[Packet.type()];

  if (!packet) {
    console.log('Received unknown packet: ' + JSON.stringify(buffer));
    return;
  }

  packet._view = Packet._view;
  packet._offset = offset;
  switch (packet) {
    case WindowHideEventPacket:
      WindowStack.emitHide(packet.id());
      break;
    case ClickPacket:
      Window.emitClick('click', buttonTypes[packet.button()]);
      break;
    case LongClickPacket:
      Window.emitClick('longClick', buttonTypes[packet.button()]);
      break;
    case AccelDataPacket:
      var samples = packet.samples();
      var accels = [];
      AccelData._view = packet._view;
      AccelData._offset = packet._size;
      for (var i = 0; i < samples; ++i) {
        accels.push(AccelData.prop());
        AccelData._offset += AccelData._size;
      }
      if (!packet.peek()) {
        Accel.emitAccelData(accels);
      } else {
        var handlers = accelListeners;
        accelListeners = [];
        for (var j = 0, jj = handlers.length; j < jj; ++j) {
          Accel.emitAccelData(accels, handlers[j]);
        }
      }
      break;
    case AccelTapPacket:
      Accel.emitAccelTap(accelAxes[packet.axis()], packet.direction());
      break;
    case MenuGetSectionPacket:
      Menu.emitSection(packet.section());
      break;
    case MenuGetItemPacket:
      Menu.emitItem(packet.section(), packet.item());
      break;
    case MenuSelectPacket:
      Menu.emitSelect('menuSelect', packet.section(), packet.item());
      break;
    case MenuLongSelectPacket:
      Menu.emitSelect('menuLongSelect', packet.section(), packet.item());
      break;
    case MenuSelectionEventPacket:
      Menu.emitSelect('menuSelection', packet.section(), packet.item());
      break;
    case ElementAnimateDonePacket:
      StageElement.emitAnimateDone(packet.id());
      break;
  }
};

SimplyPebble.onAppMessage = function(e) {
  var data = e.payload[0];
  Packet._view = toArrayBuffer(data);

  var offset = 0;
  var length = data.length;

  do {
    SimplyPebble.onPacket(Packet._view, offset);

    Packet._offset = offset;
    offset += Packet.length();
  } while (offset !== 0 && offset < length);
};

module.exports = SimplyPebble;

