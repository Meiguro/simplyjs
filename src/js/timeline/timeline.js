var Timeline = module.exports;

Timeline.init = function() {
  this._launchCallbacks = [];
};

Timeline.launch = function(callback) {
  if (this._launchEvent) {
    callback(this._launchEvent);
  } else {
    this._launchCallbacks.push(callback);
  }
};

Timeline.emitAction = function(args) {
  var e;
  if (args !== undefined) {
    e = {
      action: true,
      launchCode: args,
    };
  } else {
    e = {
      action: false,
    };
  }

  this._launchEvent = e;

  var callbacks = this._launchCallbacks;
  this._launchCallbacks = [];
  for (var i = 0, ii = callbacks.length; i < ii; ++i) {
    if (callbacks[i](e) === false) {
      return false;
    }
  }
};
