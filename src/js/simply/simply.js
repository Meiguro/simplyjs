/**
 * Simply.js
 *
 * Provides the classic "SimplyJS" API on top of PebbleJS.
 *
 * Not to be confused with ui/Simply which abstracts the implementation used
 * to interface with the underlying hardware.
 *
 * @namespace simply
 */

var WindowStack = require('ui/windowstack');
var Card = require('ui/card');
var Vibe = require('ui/vibe');

/**
 * Sets the information to be displayed on the screen.
 *
 * @memberOf simply
 * @param {object} textDef: A structure defining what to display. See {@link textDef}.
 */
simply.text = function(textDef) {
  var wind = WindowStack.top();
  if (!wind || !(wind instanceof Card)) {
    wind = new Card(textDef);
    wind.show();
  } else {
    wind.prop(textDef, true);
  }
};

/**
 * Vibrates the Pebble.
 * There are three support vibe types: short, long, and double.
 * @memberOf simply
 * @param {string} [type=short] - The vibe type.
 */
simply.vibe = function(type) {
  return Vibe.vibrate(type);
};

module.exports = simply;
