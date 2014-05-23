var util2 = require('util2');

var simply = require('simply');

var Emitter = require('emitter');

var textParams = [
  'title',
  'subtitle',
  'body',
];

var imageParams = [
  'icon',
  'subicon',
  'banner',
];

var actionParams = [
  'up',
  'select',
  'back',
];

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

textParams.concat(imageParams).forEach(function(k) {
  Card.prototype[k] = makeAccessor(k);
});

Card.prototype.show = function() {
  simply.card.call(this, {});
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
  var actionDef;
  if (typeof field === 'object') {
    actionDef = field;
    clear = value;
    value = null;
  } else {
    actionDef = {};
    actionDef[field] = value;
  }
  clear = clear === true ? 'action' : clear;
  if (clear === 'all' || clear === 'action') {
    this.state.action = actionDef;
  } else {
    util2.copy(actionDef, this.state.action);
  }
  simply.action.call(this);
  return this;
};

module.exports = Card;
