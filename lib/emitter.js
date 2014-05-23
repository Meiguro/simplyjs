
function Emitter() {
  this.listeners = {};
}

Emitter.prototype.wrapHandler = function(handler) {
  return handler;
};

Emitter.prototype.on = function(type, subtype, handler) {
  var typeMap = this.listeners;
  var subtypeMap = (typeMap[type] || ( typeMap[type] = {} ));
  (subtypeMap[subtype] || ( subtypeMap[subtype] = [] )).push({
    id: handler,
    handler: this.wrapHandler(handler),
  });
};

Emitter.prototype.off = function(type, subtype, handler) {
  if (!type) {
    this.listeners = {};
    return;
  }
  var typeMap = this.listeners;
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
  var index = -1;
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    if (handlers[i].id === handler) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return;
  }
  handlers.splice(index, 1);
};

var emitToHandlers = function(type, handlers, e) {
  if (!handlers) {
    return;
  }
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    var handler = handlers[i].handler;
    if (handler(e, type, i) === false) {
      return true;
    }
  }
  return false;
};

Emitter.prototype.emit = function(type, subtype, e) {
  if (!e) {
    e = subtype;
    subtype = null;
  }
  e.type = type;
  if (subtype) {
    e.subtype = subtype;
  }
  var typeMap = this.listeners;
  var subtypeMap = typeMap[type];
  if (!subtypeMap) {
    return;
  }
  if (emitToHandlers(type, subtypeMap[subtype], e) === true) {
    return true;
  }
  if (emitToHandlers(type, subtypeMap.all, e) === true) {
    return true;
  }
  return false;
};

module.exports = Emitter;
