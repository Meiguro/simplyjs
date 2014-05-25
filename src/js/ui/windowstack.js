var util2 = require('lib/util2');
var myutil = require('base/myutil');
var Emitter = require('base/emitter');

var WindowStack = function() {
  this.init();
};

util2.copy(Emitter.prototype, WindowStack.prototype);

WindowStack.prototype.init = function() {
  this.off();
  this._items = [];

  this.on('show', function(e) {
    e.window.forEachListener(e.window.onAddHandler);
  });
  this.on('hide', function(e) {
    e.window.forEachListener(e.window.onRemoveHandler);
  });
};

WindowStack.prototype.top = function() {
  return util2.last(this._items);
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

WindowStack.prototype._hide = function(item, broadcast) {
  if (!item) { return; }
  this._emitHide(item);
  item._hide(broadcast);
};

WindowStack.prototype.push = function(item) {
  if (item === this.top()) { return; }
  this.remove(item);
  var prevTop = this.top();
  this._items.push(item);
  this._show(item);
  this._hide(prevTop, false);
};

WindowStack.prototype.pop = function(broadcast) {
  return this.remove(this.top(), broadcast);
};

WindowStack.prototype.remove = function(item, broadcast) {
  if (typeof item === 'number') {
    item = this.get(item);
  }
  if (!item) { return; }
  var index = this._items.indexOf(item);
  if (index === -1) { return item; }
  var wasTop = (item === this.top());
  this._items.splice(index, 1);
  if (wasTop) {
    this._show(this.top());
    this._hide(item, broadcast);
  }
  return item;
};

WindowStack.prototype.get = function(windowId) {
  var items = this._items;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    var wind = items[i];
    if (wind._id() === windowId) {
      return wind;
    }
  }
};

module.exports = new WindowStack();
