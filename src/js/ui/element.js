var util2 = require('util2');
var Vector2 = require('vector2');
var myutil = require('myutil');
var WindowStack = require('ui/windowstack');
var Propable = require('ui/propable');
var simply = require('ui/simply');

var elementProps = [
  'position',
  'size',
  'borderColor',
  'backgroundColor',
];

var accessorProps = elementProps;

var nextId = 1;

var StageElement = function(elementDef) {
  this.state = elementDef || {};
  this.state.id = nextId++;
  this._queue = [];
};

util2.copy(Propable.prototype, StageElement.prototype);

Propable.makeAccessors(accessorProps, StageElement.prototype);

StageElement.prototype._reset = function() {
  this._queue = [];
};

StageElement.prototype._id = function() {
  return this.state.id;
};

StageElement.prototype._type = function() {
  return this.state.type;
};

StageElement.prototype._prop = function(elementDef) {
  if (!this.state.position) {
    this.state.position = new Vector2();
  }
  if (!this.state.size) {
    this.state.size = new Vector2();
  }
  if (this.parent === WindowStack.top()) {
    simply.impl.stageElement(this._id(), this._type(), elementDef);
  }
};

StageElement.prototype.index = function() {
  if (!this.parent) { return -1; }
  return this.parent.index(this);
};

StageElement.prototype.remove = function(broadcast) {
  if (!this.parent) { return this; }
  this.parent.remove(this, broadcast);
  return this;
};

StageElement.prototype._animate = function(animateDef, duration) {
  if (this.parent === WindowStack.top()) {
    simply.impl.stageAnimate(this._id(), animateDef, duration || 400, animateDef.easing || 'easeInOut');
  }
};

StageElement.prototype.animate = function(field, value, duration) {
  if (typeof field === 'object') {
    duration = value;
  }
  var animateDef = myutil.toObject(field, value);
  util2.copy(animateDef, this.state);
  function animate() {
    this._animate(animateDef, duration);
  }
  if (this._queue.length === 0) {
    animate.call(this);
  } else {
    this.queue(animate);
  }
  return this;
};

StageElement.prototype.queue = function(callback) {
  this._queue.push(callback);
};

StageElement.prototype.dequeue = function() {
  var callback = this._queue.shift();
  if (!callback) { return; }
  callback.call(this, this.dequeue.bind(this));
};

StageElement.emitAnimateDone = function(index) {
  if (index === -1) { return; }
  var wind = WindowStack.top();
  if (!wind || !wind._dynamic) { return; }
  var element = wind.at(index);
  if (!element) { return; }
  element.dequeue();
};

module.exports = StageElement;
