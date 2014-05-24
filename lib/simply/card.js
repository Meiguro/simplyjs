var util2 = require('util2');
var myutil = require('myutil');
var simply = require('simply');

var Emitter = require('emitter');
var Window = require('simply/window');

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

var actionProps = [
  'up',
  'select',
  'back',
];

var accessorProps = textProps.concat(imageProps);
var clearableProps = textProps.concat(imageProps);

var Card = function(cardDef) {
  this.state = cardDef || {};
};

util2.inherit(Card, Window);

util2.copy(Emitter.prototype, Card.prototype);

accessorProps.forEach(function(k) {
  Card.prototype[k] = myutil.makeAccessor(k);
});

Card.prototype._prop = function() {
  return simply.card.apply(this, arguments);
};

Card.prototype._clear = function(flags) {
  flags = myutil.toFlags(flags);
  if (myutil.flag(flags, 'all')) {
    clearableProps.forEach(myutil.unset.bind(this));
  } else if (myutil.flag(flags, 'action')) {
    this._clearAction();
  }
};

module.exports = Card;
