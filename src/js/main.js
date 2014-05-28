/*
 * This is the main PebbleJS file. You do not need to modify this file unless
 * you want to change the way PebbleJS starts, the script it runs or the libraries
 * it loads.
 *
 * By default, this will initialize all the libraries and run app.js
 */

require('lib/safe');

Pebble.Settings = require('settings/settings');
Pebble.Accel = require('ui/accel');

var UI = {};
UI.Vector2 = require('lib/vector2');
UI.Card = require('ui/card');
UI.Menu = require('ui/menu');
UI.Stage = require('ui/stage');
UI.Rect = require('ui/rect');
UI.Circle = require('ui/circle');
UI.Text = require('ui/text');
UI.Image = require('ui/image');
Pebble.UI = UI;

//Pebble.SmartPackage = require('pebble/smartpackage');

Pebble.addEventListener('ready', function(e) {
  // Load the SimplyJS Pebble implementation
  require('ui/simply-pebble').init();
  Pebble.Settings.init();
  Pebble.Accel.init();
  console.log("Done loading PebbleJS - Starting app.");

  // Load local file
  require('app.js');
  //require('ui/tests');

  // Or use Smart Package to load a remote JS file
  //Pebble.SmartPackage.init('http://www.sarfata.org/myapp.js');

  // or Ask the user to enter a URL to run in the Settings
  //Pebble.SmartPackage.initWithSettings();

  // or Load a list of app and let the user choose in the Settings which one to run.
  //Pebble.SmartPackage.loadBundle('http://www.sarfata.org/myapps.json');
});

