Pebble.JS
=========

Pebble.JS is a JavaScript framework for Pebble development. Pebble.JS allows you to write great looking Pebble apps with only JavaScript code.

## How does it work?

Pebble.JS is built on top of the Pebble SDK. Your JavaScript code runs on the phone and uses the Pebble.JS library to exchange messages with the Pebble watch currently connected.

The Pebble runs the Pebble.JS application which translates the commands into a UI on the screen and relays user interactions (accelerometer, buttons, etc) to the code.

## How to use it?

Just open the `src/js/app.js` and start writing code!

    var card = new Pebble.UI.Card({ title: "Hello World", body: "Your first Pebble app!" });
    card.show();

Reacting to button interactions is also very easy:

    card.on('singleClick', function(e) {
      card.subtitle("Button " + e.button + " pressed.");
    }

And making HTTP connection too, with the included `ajax` library.

    var ajax = require('ajax');
    ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
         function(data) {
           card.body(data.contents.quote);
           card.title(data.contents.author);
         });

You can do much more with Pebble.JS:

 - Get accelerometer values
 - Display complex UI mixing geometric elements, text and images
 - Animate elements on the screen
 - Display arbitrary long menus
 - Use the GPS and LocalStorage on the phone
 - etc!

The full API reference is available on the [Pebble developer website](http://developer.getpebble.com/).

## Who wrote this? Is this supported by Pebble?

Pebble.JS started as [Simply.JS](http://www.simplyjs.io), a project by [Meiguro](http://github.com/meiguro). It is now part of the Pebble SDK and supported by Pebble. Contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com) with any questions!

