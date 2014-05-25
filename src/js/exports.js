var Settings = require('base/settings');
var Accel = require('base/accel');
var Card = require('ui/card');
var Menu = require('ui/menu');

Pebble.Settings = Settings;

Pebble.Accel = Accel;

var UI = {};
UI.Card = Card;
UI.Menu = Menu;

Pebble.UI = UI;

module.exports = Pebble;
