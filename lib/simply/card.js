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
      simply.card.call(this, k, value);
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

module.exports = Card;
