var util2 = require('util2');
var Emitter = require('emitter');
var Settings = require('settings');
var simply = require('ui/simply');

var Wakeup = function() {
  this.init();
};

util2.copy(Emitter.prototype, Wakeup.prototype);

Wakeup.prototype.init = function() {
  this.off();
  this._setRequests = [];
  this._loadData();
};

Wakeup.prototype._loadData = function() {
  this.state = Settings._loadData(null, 'wakeup', true) || {};
  this.state.wakeups = this.state.wakeups || {};
};

Wakeup.prototype._saveData = function() {
  Settings._saveData(null, 'wakeup', this.state);
};

Wakeup.prototype.get = function(id) {
  var wakeup = this.state.wakeups[id];
  if (wakeup) {
    return {
      id: id,
      cookie: wakeup.cookie,
      data: wakeup.data,
      time: wakeup.params.time,
      notifyIfMissed: wakeup.params.notifyIfMissed,
    };
  }
};

Wakeup.prototype.each = function(callback) {
  for (var id in this.state.wakeups) {
    callback(this.get(id));
  }
};

Wakeup.prototype.schedule = function(opt, callback) {
  if (typeof opt === 'number') {
    opt = { time: opt };
  } else if (opt instanceof Date) {
    opt = { time: opt.getTime() / 1000 };
  }
  var cookie = opt.cookie || 0;
  this._setRequests.push({
    params: opt,
    data: opt.data,
    callback: callback,
  });
  simply.impl.wakeupSet(opt.time, opt.cookie, opt.notifyIfMissed);
};

Wakeup.prototype.cancel = function(id) {
  if (id === 'all') {
    this.state.wakeups = {};
  } else {
    delete this.state.wakeups[id];
  }
  simply.impl.wakeupCancel(id);
};

Wakeup.prototype._makeWakeupEvent = function(id, cookie, remove) {
  var wakeup = this.state.wakeups[id];
  if (remove) {
    delete this.state.wakeups[id];
  }
  var e = {
    id: id,
    cookie: cookie,
  };
  if (wakeup) {
    e.data = wakeup.data;
  }
  return e;
};

Wakeup.prototype.emitSetResult = function(id, cookie) {
  var req = this._setRequests.splice(0, 1)[0];
  if (!req) {
    return;
  }
  var e;
  if (typeof id === 'number') {
    this.state.wakeups[id] = {
      id: id,
      cookie: cookie,
      data: req.data,
      params: req.params,
    };
    this._saveData();
    e = this._makeWakeupEvent(id, cookie);
    e.failed = false;
  } else {
    e = {
      error: id,
      failed: true,
      cookie: cookie,
      data: req.data,
    };
  }
  req.callback(e);
};

Wakeup.prototype.emitWakeup = function(id, cookie) {
  var e = this._makeWakeupEvent(id, cookie, true);
  this.emit('wakeup', e);
};

module.exports = new Wakeup();
