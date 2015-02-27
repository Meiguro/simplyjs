var util2 = require('util2');
var Settings = require('settings');
var simply = require('ui/simply');

var Wakeup = module.exports;

var cleanupGracePeriod = 60 * 5;

Wakeup.init = function() {
  this._setRequests = [];
  this._launchCallbacks = [];
  this._loadData();
  this._cleanup();
};

Wakeup._loadData = function() {
  this.state = Settings._loadData(null, 'wakeup', true) || {};
  this.state.wakeups = this.state.wakeups || {};
};

Wakeup._saveData = function() {
  Settings._saveData(null, 'wakeup', this.state);
};

Wakeup._cleanup = function() {
  var id;
  var ids = [];
  for (id in this.state.wakeups) {
    ids.push(id);
  }
  var cleanupTime = new Date().getTime() / 1000 - cleanupGracePeriod;
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

Wakeup.get = function(id) {
  var wakeup = this.state.wakeups[id];
  if (wakeup) {
    return {
      id: id,
      cookie: wakeup.cookie,
      data: wakeup.data,
      time: wakeup.params.time,
      notifyIfMissed: !!wakeup.params.notifyIfMissed,
    };
  }
};

Wakeup.each = function(callback) {
  var i = 0;
  for (var id in this.state.wakeups) {
    callback(this.get(id), i++);
  }
};

Wakeup.schedule = function(opt, callback) {
  if (typeof opt !== 'object' || opt instanceof Date) {
    opt = { time: opt };
  }
  var cookie = opt.cookie || 0;
  this._setRequests.push({
    params: opt,
    data: opt.data,
    callback: callback,
  });
  simply.impl.wakeupSet(opt.time, cookie, opt.notifyIfMissed);
};

Wakeup.cancel = function(id) {
  if (id === 'all') {
    this.state.wakeups = {};
  } else {
    delete this.state.wakeups[id];
  }
  simply.impl.wakeupCancel(id);
};

Wakeup.launch = function(callback) {
  if (this._launchEvent) {
    callback(this._launchEvent);
  } else {
    this._launchCallbacks.push(callback);
  }
};

Wakeup._makeWakeupEvent = function(id, cookie) {
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

Wakeup.emitSetResult = function(id, cookie) {
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
  return req.callback(e);
};

Wakeup.emitWakeup = function(id, cookie) {
  var e;
  if (typeof id === 'number') {
    e = this._makeWakeupEvent(id, cookie);
    e.wakeup = true;
  } else {
    e = {
      wakeup: false,
    };
  }

  delete this.state.wakeups[id];
  this._saveData();
  this._launchEvent = e;

  var callbacks = this._launchCallbacks;
  this._launchCallbacks = [];
  for (var i = 0, ii = callbacks.length; i < ii; ++i) {
    if (callbacks[i](e) === false) {
      return false;
    }
  }
};
