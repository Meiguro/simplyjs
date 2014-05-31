var util2 = require('util2');
var Emitter = require('emitter');
var WindowStack = require('ui/windowstack');
var Window = require('ui/window');
var simply = require('ui/simply');

var Stage = function(stageDef) {
  Window.call(this, stageDef);
  this._items = [];
};

util2.inherit(Stage, Window);

util2.copy(Emitter.prototype, Stage.prototype);

Stage.prototype._show = function() {
  Window.prototype._show.apply(this, arguments);
  this.each(function(element, index) {
    this._insert(index, element);
  }.bind(this));
};

Stage.prototype._prop = function() {
  if (this === WindowStack.top()) {
    simply.impl.stage.apply(this, arguments);
  }
};

Stage.prototype.each = function(callback) {
  this._items.forEach(callback);
  return this;
};

Stage.prototype.index = function(element) {
  return this._items.indexOf(element);
};

Stage.prototype._insert = function(index, element) {
  if (this === WindowStack.top()) {
    simply.impl.stageElement(element._id(), element._type(), element.state, index);
  }
};

Stage.prototype._remove = function(element, broadcast) {
  if (broadcast === false) { return; }
  if (this === WindowStack.top()) {
    simply.impl.stageRemove(element._id());
  }
};

Stage.prototype.insert = function(index, element) {
  element.remove(false);
  this._items.splice(index, 0, element);
  element.parent = this;
  this._insert(this.index(element), element);
  return this;
};

Stage.prototype.add = function(element) {
  return this.insert(this._items.length, element);
};

Stage.prototype.remove = function(element, broadcast) {
  var index = this.index(element);
  if (index === -1) { return this; }
  this._remove(element, broadcast);
  this._items.splice(index, 1);
  delete element.parent;
  return this;
};

module.exports = Stage;
