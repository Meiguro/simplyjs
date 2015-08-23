var util2 = require('util2');
var Emitter = require('emitter');
var Settings = require('settings');
var simply = require('ui/simply');

var Wakeup = function() {
  this.init();
};

Wakeup.prototype.cleanupGracePeriod = 60 * 5;

util2.copy(Emitter.prototype, Wakeup.prototype);

Wakeup.prototype.init = function() {
  this._setRequests = [];
  this._launchCallbacks = [];
  this._loadData();
  this._cleanup();
};

Wakeup.prototype._loadData = function() {
  this.state = Settings._loadData(null, 'wakeup', true) || {};
  this.state.wakeups = this.state.wakeups || {};
};

Wakeup.prototype._saveData = function() {
  Settings._saveData(null, 'wakeup', this.state);
};

Wakeup.prototype._cleanup = function() {
  var id;
  var ids = [];
  for (id in this.state.wakeups) {
    ids.push(id);
  }
  var cleanupTime = Date.now() / 1000 - Wakeup.cleanupGracePeriod;
  var deleted = false;
  for (var i = 0, ii = ids.length; i < ii; ++i) {
    id = ids[i];
    var wakeup = this.state.wakeups[id];
    if (wakeup.params.time < cleanupTime) {
      deleted = true;
      delete this.state.wakeups[id];
    }
  }
  if (deleted) {
    this._saveData();
  }
};

Wakeup.prototype.get = function(id) {
  var wakeup = this.state.wakeups[id];
  if (wakeup) {
    return {
      id: wakeup.id,
      cookie: wakeup.cookie,
      data: wakeup.data,
      time: wakeup.params.time,
      notifyIfMissed: !!wakeup.params.notifyIfMissed,
    };
  }
};

Wakeup.prototype.each = function(callback) {
  var i = 0;
  for (var id in this.state.wakeups) {
    if (callback(this.get(id), i++) === false) {
      break;
    }
  }
};

Wakeup.prototype.schedule = function(opt, callback) {
  if (typeof opt !== 'object' || opt instanceof Date) {
    opt = { time: opt };
  }
  var cookie = opt.cookie || 0;
  this._setRequests.push({
    params: opt,
    data: opt.data,
    callback: callback,
  });
  this.launch(function() {
    simply.impl.wakeupSet(opt.time, cookie, opt.notifyIfMissed);
  });
};

Wakeup.prototype.cancel = function(id) {
  if (id === 'all') {
    this.state.wakeups = {};
  } else {
    delete this.state.wakeups[id];
  }
  simply.impl.wakeupCancel(id);
};

Wakeup.prototype.launch = function(callback) {
  if (this._launchEvent) {
    callback(this._launchEvent);
  } else {
    this._launchCallbacks.push(callback);
  }
};

Wakeup.prototype._makeBaseEvent = function(id, cookie) {
  var wakeup = this.state.wakeups[id];
  var e = {
    id: id,
    cookie: cookie,
  };
  if (wakeup) {
    e.data = wakeup.data;
  }
  return e;
};

Wakeup.prototype._makeWakeupEvent = function(id, cookie) {
  var e;
  if (id !== undefined) {
    e = this._makeBaseEvent(id, cookie);
    e.wakeup = true;
  } else {
    e = { wakeup: false };
  }
  return e;
};

Wakeup.prototype._setWakeup = function(id, wakeup) {
  this.state.wakeups[id] = wakeup;
  this._saveData();
};

Wakeup.prototype._removeWakeup = function(id) {
  if (id in this.state.wakeups) {
    delete this.state.wakeups[id];
    this._saveData();
  }
};

Wakeup.prototype.emitSetResult = function(id, cookie) {
  var req = this._setRequests.shift();
  if (!req) {
    return;
  }
  var e;
  if (typeof id === 'number') {
    this._setWakeup(id, {
      id: id,
      cookie: cookie,
      data: req.data,
      params: req.params,
    });
    e = this._makeBaseEvent(id, cookie);
    e.failed = false;
  } else {
    e = {
      error: id,
      failed: true,
      cookie: cookie,
      data: req.data,
    };
  }
  return req.callback(e);
};

Wakeup.prototype.emitWakeup = function(id, cookie) {
  var e = this._makeWakeupEvent(id, cookie);

  if (!this._launchEvent) {
    e.launch = true;
    if (this._emitWakeupLaunch(e) === false) {
      return false;
    }
  } else {
    e.launch = false;
  }

  if (e.wakeup) {
    this._removeWakeup(id);
    if (this.emit('wakeup', e) === false) {
      return false;
    }
  }
};

Wakeup.prototype._emitWakeupLaunch = function(e) {
  this._launchEvent = e;

  var callbacks = this._launchCallbacks;
  this._launchCallbacks = [];

  for (var i = 0, ii = callbacks.length; i < ii; ++i) {
    if (callbacks[i](e) === false) {
      return false;
    }
  }
};

module.exports = new Wakeup();
