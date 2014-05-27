console.log("Running main.js ...");

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

function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message);
    }
    if (err.stack) {
      console.log('\nStacktrace:');
      console.log('====================');
      console.log(err.stack);
    }
  } else {
    console.log('dumpError :: argument is not an object');
  }
}

Pebble.addEventListener('ready', function(e) {
  try {
    console.log("Running the Pebble.ready event....");

    // Load the SimplyJS Pebble implementation
    require('ui/simply-pebble').init();

    Pebble.Settings.init();
    Pebble.Accel.init();

    var wind = new UI.Card({ title: "PebbleJS", body: "Saying Hello World" });
    wind.show();

    wind.on('singleClick', function(e) {
      var menu = new UI.Menu();
      menu.items(0, [ { title: 'Hello World!', subtitle: 'text' }, { title: 'item2' } ]);
      menu.show();
    });

    console.log("Done running init");

    // Load local file
    //require('app.js');

    // Or use Smart Package to load a remote JS file
    //Pebble.SmartPackage.init('http://www.sarfata.org/myapp.js');

    // or Ask the user to enter a URL to run in the Settings
    //Pebble.SmartPackage.initWithSettings();

    // or Load a list of app and let the user choose in the Settings which one to run.
    //Pebble.SmartPackage.loadBundle('http://www.sarfata.org/myapps.json');
  }
  catch (err) {
    dumpError(err);
  }
});
