var util2 = require('util2');
var myutil = require('myutil');
var simply = require('simply');

var Emitter = require('emitter');

var textProps = [
  'title',
  'subtitle',
  'body',
];

var imageProps = [
  'icon',
  'subicon',
  'banner',
];

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

var accessorProps = textProps.concat(imageProps).concat(configProps);
var clearableProps = textProps.concat(imageProps);

var Card = function(cardDef) {
  this.state = cardDef || {};
};

util2.copy(Emitter.prototype, Card.prototype);

var makeAccessor = function(k) {
  return function(value) {
    if (arguments.length === 0) {
      return this.state[k];
    } else {
      this.state[k] = value;
      if (simply.card() === this) {
        simply.card.call(this, k, value);
      }
      return this;
    }
  };
};

accessorProps.forEach(function(k) {
  Card.prototype[k] = makeAccessor(k);
});

Card.prototype.show = function() {
  simply.card.call(this, {});
  return this;
};

var unset = function(obj, k) {
  if (typeof k === 'undefined') {
    k = obj;
    obj = this.state;
  }
  if (typeof obj === 'object') {
    delete obj[k];
  }
};

var clearProps = function(flags) {
  flags = myutil.toFlags(flags);
  if (myutil.flag(flags, 'all')) {
    clearableProps.forEach(unset.bind(this));
  } else if (myutil.flag(flags, 'action')) {
    actionProps.forEach(unset.bind(this, this.state.action));
  }
};

Card.prototype.prop = function(field, value, clear) {
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
    clearProps.call(this, 'all');
  }
  var cardDef = myutil.toObject(field, value);
  util2.copy(cardDef, this.state);
  if (simply.card() === this) {
    simply.card.call(this, cardDef);
  }
  return this;
};

Card.prototype.action = function(field, value, clear) {
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
    clearProps.call(this, 'action');
  }
  if (typeof field !== 'boolean') {
    util2.copy(myutil.toObject(field, value), this.state.action);
  }
  simply.action.call(this);
  return this;
};

module.exports = Card;
