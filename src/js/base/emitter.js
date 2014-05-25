
var Emitter = function() {
  this._events = {};
};

Emitter.prototype.wrapHandler = function(handler) {
  return handler;
};

Emitter.prototype._on = function(type, subtype, handler) {
  var typeMap = this._events || ( this._events = {} );
  var subtypeMap = typeMap[type] || ( typeMap[type] = {} );
  (subtypeMap[subtype] || ( subtypeMap[subtype] = [] )).push({
    id: handler,
    handler: this.wrapHandler(handler),
  });
};

Emitter.prototype._off = function(type, subtype, handler) {
  if (!type) {
    this._events = {};
    return;
  }
  var typeMap = this._events;
  if (!handler && subtype === 'all') {
    delete typeMap[type];
    return;
  }
  var subtypeMap = typeMap[type];
  if (!subtypeMap) { return; }
  if (!handler) {
    delete subtypeMap[subtype];
    return;
  }
  var handlers = subtypeMap[subtype];
  if (!handlers) { return; }
  var index = -1;
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    if (handlers[i].id === handler) {
      index = i;
      break;
    }
  }
  if (index === -1) { return; }
  handlers.splice(index, 1);
};

Emitter.prototype.on = function(type, subtype, handler) {
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  this._on(type, subtype, handler);
  if (Emitter.onAddHandler) {
    Emitter.onAddHandler(type, subtype, handler);
  }
  if (this.onAddHandler) {
    this.onAddHandler(type, subtype, handler);
  }
};

Emitter.prototype.off = function(type, subtype, handler) {
  if (!handler) {
    handler = subtype;
    subtype = 'all';
  }
  this._off(type, subtype, handler);
  if (Emitter.onRemoveHandler) {
    Emitter.onRemoveHandler(type, subtype, handler);
  }
  if (this.onRemoveHandler) {
    this.onRemoveHandler(type, subtype, handler);
  }
};

Emitter.prototype.listeners = function(type, subtype) {
  if (!subtype) {
    subtype = 'all';
  }
  var typeMap = this._events;
  if (!typeMap) { return; }
  var subtypeMap = typeMap[type];
  if (!subtypeMap) { return; }
  return subtypeMap[subtype];
};

Emitter.prototype.listenerCount = function(type, subtype) {
  var listeners = this.listeners(type, subtype);
  return listeners ? listeners.length : 0;
};

Emitter.prototype.forEachListener = function(type, subtype, callback) {
  var typeMap = this._events;
  if (!typeMap) { return; }
  var subtypeMap;
  if (typeof callback === 'function') {
    var handlers = this.listeners(type, subtype);
    if (!handlers) { return; }
    for (var i = 0, ii = handlers.length; i < ii; ++i) {
      callback.call(this, type, subtype, handlers[i]);
    }
  } else if (typeof subtype === 'function') {
    callback = subtype;
    subtypeMap = typeMap[type];
    if (!subtypeMap) { return; }
    for (subtype in subtypeMap) {
      this.forEachListener(type, subtype, callback);
    }
  } else if (typeof type === 'function') {
    callback = type;
    for (type in typeMap) {
      this.forEachListener(type, callback);
    }
  }
};

var emitToHandlers = function(type, handlers, e) {
  if (!handlers) { return; }
  for (var i = 0, ii = handlers.length; i < ii; ++i) {
    var handler = handlers[i].handler;
    if (handler.call(this, e, type, i) === false) {
      return false;
    }
  }
  return true;
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
  var typeMap = this._events;
  if (!typeMap) { return; }
  var subtypeMap = typeMap[type];
  if (!subtypeMap) { return; }
  var hadSubtype = emitToHandlers.call(this, type, subtypeMap[subtype], e);
  if (hadSubtype === false) {
    return false;
  }
  var hadAll = emitToHandlers.call(this, type, subtypeMap.all, e);
  if (hadAll === false) {
    return false;
  }
  if (hadSubtype || hadAll) {
    return true;
  }
};

module.exports = Emitter;
