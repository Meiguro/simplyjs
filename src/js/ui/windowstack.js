var util2 = require('util2');
var myutil = require('myutil');
var simply = require('simply');

var Emitter = require('emitter');

var WindowStack = function() {
  this.state = {};
  this.state.items = [];
};

util2.copy(Emitter.prototype, WindowStack.prototype);

WindowStack.prototype.top = function() {
  return util2.last(this.state.items);
};

WindowStack.prototype._emitShow = function(item) {
  var e = {
    window: item
  };
  this.emit('show', e);
};

WindowStack.prototype._emitHide = function(item) {
  var e = {
    window: item
  };
  this.emit('hide', e);
};

WindowStack.prototype._show = function(item) {
  if (!item) { return; }
  this._emitShow(item);
  item._show();
};

WindowStack.prototype._hide = function(item) {
  if (!item) { return; }
  this._emitHide(item);
  item._hide();
};

WindowStack.prototype.push = function(item) {
  if (item === this.top()) { return; }
  this.remove(item);
  this._hide(this.top());
  this.state.items.push(item);
  this._show(item);
};

WindowStack.prototype.pop = function(item) {
  this.remove(this.top());
};

WindowStack.prototype.remove = function(item) {
  if (!item) { return; }
  var index = this.state.items.indexOf(item);
  if (index === -1) { return; }
  var wasTop = (item === this.top());
  if (wasTop) {
    this._hide(item);
  }
  this.state.items.splice(index, 1);
  if (wasTop) {
    this._show(this.top());
  }
};

WindowStack.prototype.get = function(windowId) {
  var items = this.state.items;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    var wind = items[i];
    if (wind._id() === windowId) {
      return wind;
    }
  }
};

module.exports = WindowStack;
