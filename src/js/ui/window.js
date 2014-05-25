var util2 = require('util2');
var myutil = require('myutil');
var simply = require('simply');

var Emitter = require('emitter');

var configProps = [
  'fullscreen',
  'style',
  'scrollable',
];

var actionProps = [
  'up',
  'select',
  'back',
];

var accessorProps = configProps;

var nextId = 1;

var Window = function(windowDef) {
  this.state = windowDef || {};
  this._id = nextId++;
};

util2.copy(Emitter.prototype, Window.prototype);

accessorProps.forEach(function(k) {
  Window.prototype[k] = myutil.makeAccessor(k);
});

Window.prototype._prop = function() {
  return simply.window.apply(this, arguments);
};

Window.prototype.show = function() {
  this._prop({});
  return this;
};

Window.prototype._clearAction = function() {
  actionProps.forEach(myutil.unset.bind(this, this.state.action));
};

Window.prototype._clear = function(flags) {
  flags = myutil.toFlags(flags);
  if (myutil.flag(flags, 'action')) {
    this._clearAction();
  }
};

Window.prototype.prop = function(field, value, clear) {
  if (arguments.length === 0) {
    return util2.copy(this.state);
  }
  if (arguments.length === 1 && typeof field !== 'object') {
    return this.state[field];
  }
  if (typeof clear === 'undefined') {
    clear = value;
  }
  if (clear) {
    this._clear('all');
  }
  var windowDef = myutil.toObject(field, value);
  util2.copy(windowDef, this.state);
  if (this._prop() === this) {
    this._prop(windowDef);
  }
  return this;
};

Window.prototype.action = function(field, value, clear) {
  var action = this.state.action;
  if (!action) {
    action = this.state.action = {};
  }
  if (arguments.length === 0) {
    return action;
  }
  if (arguments.length === 1 && typeof field !== 'object') {
    return action[field];
  }
  if (typeof clear === 'undefined') {
    clear = value;
  }
  if (clear) {
    this._clear('action');
  }
  if (typeof field !== 'boolean') {
    util2.copy(myutil.toObject(field, value), this.state.action);
  }
  simply.action.call(this);
  return this;
};

module.exports = Window;
