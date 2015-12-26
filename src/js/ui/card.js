var util2 = require('util2');
var myutil = require('myutil');
var Emitter = require('emitter');
var WindowStack = require('ui/windowstack');
var Propable = require('ui/propable');
var Window = require('ui/window');
var simply = require('ui/simply');

var textProps = [
  'title',
  'subtitle',
  'body',
];

var textColorProps = [
  'titleColor',
  'subtitleColor',
  'bodyColor',
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

var configProps = [
  'style',
  'backgroundColor'
];

var accessorProps = textProps.concat(textColorProps).concat(imageProps).concat(configProps);
var clearableProps = textProps.concat(imageProps);

var defaults = {
  status: true,
  backgroundColor: 'white',
};

var Card = function(cardDef) {
  Window.call(this, myutil.shadow(defaults, cardDef || {}));
  this._dynamic = false;
};

Card._codeName = 'card';

util2.inherit(Card, Window);

util2.copy(Emitter.prototype, Card.prototype);

Propable.makeAccessors(accessorProps, Card.prototype);

Card.prototype._prop = function() {
  if (this === WindowStack.top()) {
    simply.impl.card.apply(this, arguments);
  }
};

Card.prototype._clear = function(flags) {
  flags = myutil.toFlags(flags);
  if (flags === true) {
    clearableProps.forEach(Propable.unset.bind(this));
  }
  if (myutil.flag(flags, 'action')) {
    this._clearAction();
  }
};

module.exports = Card;
