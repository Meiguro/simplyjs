var util2 = require('lib/util2');
var myutil = require('base/myutil');
var Emitter = require('base/emitter');
var Window = require('ui/window');
var simply = require('simply');

/**
 * Sets the title field. The title field is the first and largest text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */

/**
 * Sets the subtitle field. The subtitle field is the second large text field available.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */

/**
 * Sets the body field. The body field is the last text field available meant to display large bodies of text.
 * This can be used to display entire text interfaces.
 * You may even clear the title and subtitle fields in order to display more in the body field.
 * @memberOf simply
 * @param {string} text - The desired text to display.
 * @param {boolean} [clear] - If true, all other text fields will be cleared.
 */

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

/**
 * Set the Pebble UI style.
 * The available styles are 'small', 'large', and 'mono'. Small and large correspond to the system notification styles.
 * Mono sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.
 * @memberOf simply
 * @param {string} type - The type of style to set: 'small', 'large', or 'mono'.
 */

var configProps = [
  'style',
];

var accessorProps = textProps.concat(imageProps).concat(configProps);
var clearableProps = textProps.concat(imageProps);

var Card = function(cardDef) {
  Window.call(this, cardDef);
};

Card._codeName = 'card';

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
