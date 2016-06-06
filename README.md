Pebble.js
=========

[![Build Status](https://travis-ci.org/pebble/pebblejs.svg?branch=master)](https://travis-ci.org/pebble/pebblejs)

Pebble.js lets you write beautiful Pebble applications completely in JavaScript.

Pebble.js applications run on your phone. They have access to all the resources of your phone (internet connectivity, GPS, almost unlimited memory, etc). Because they are written in JavaScript they are also perfect to make HTTP requests and connect your Pebble to the internet.

**Warning:** Pebble.js is still in beta, so breaking API changes are possible. Pebble.js is best suited for prototyping and applications that inherently require communication in response to user actions, such as accessing the internet. Please be aware that as a result of Bluetooth round-trips for all actions, Pebble.js apps will use more power and respond slower to user interaction than a similar native app.

> ![JSConf 2014](http://2014.jsconf.us/img/logo.png)
>
> Pebble.js was announced during JSConf 2014!

## Getting Started

 * In CloudPebble

   The easiest way to use Pebble.js is in [CloudPebble](https://cloudpebble.net). Select the 'Pebble.js' project type when creating a new project.

   [Build a Pebble.js application now in CloudPebble >](https://cloudpebble.net)

 * With the Pebble SDK

   This option allows you to customize Pebble.js. Follow the [Pebble SDK installation instructions](https://developer.pebble.com/sdk/install/) to install the SDK on your computer and [fork this project](http://github.com/pebble/pebblejs) on Github. 
   
   The main entry point for your application is in the `src/js/app.js` file. For projects with multiple files, you may move `src/js/app.js` to `src/js/app/index.js` instead and create new files under `src/js/app`.

   [Install the Pebble SDK on your computer >](http://developer.pebble.com/sdk/install/)


Pebble.js applications follow modern JavaScript best practices. To get started, you just need to call `require('ui')` to load the UI module and start building user interfaces.

````js
var UI = require('ui');
````

The basic block to build user interface is the [Card]. A Card is a type of [Window] that occupies the entire screen and allows you to display some text in a pre-structured way: a title at the top, a subtitle below it and a body area for larger paragraphs. Cards can be made scrollable to display large quantities of information. You can also add images next to the title, subtitle or in the body area.

````js
var card = new UI.Card({
  title: 'Hello World',
  body: 'This is your first Pebble app!',
  scrollable: true
});
````

After creating a card window, push it onto the screen with the `show()` method.

````js
card.show();
````

To interact with the users, use the buttons or the accelerometer. Add callbacks to a window with the `.on()` method:

````js
card.on('click', function(e) {
  card.subtitle('Button ' + e.button + ' pressed.');
});
````

Making HTTP connections is very easy with the included `ajax` library.

````js
var ajax = require('ajax');
ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
  function(data) {
    card.body(data.contents.quotes[0].quote);
    card.title(data.contents.quotes[0].author);
  }
);
````

You can do much more with Pebble.js:

 - Get accelerometer values
 - Display complex UI mixing geometric elements, text and images
 - Animate elements on the screen
 - Display arbitrary long menus
 - Use the GPS and LocalStorage on the phone
 - etc!

Keep reading for the full [API Reference].

## Using Images
[Using Images]: #using-images

You can use images in your Pebble.js application. Currently all images must be embedded in your applications. They will be resized and converted to black and white when you build your project.

We recommend that you follow these guidelines when preparing your images for Pebble:

 * Resize all images for the screen of Pebble. A fullscreen image will be 144 pixels wide by 168 pixels high.
 * Use an image editor or [HyperDither](http://2002-2010.tinrocket.com/software/hyperdither/index.html) to dither your image in black and white.
 * Remember that the maximum size for a Pebble application is 100kB. You will quickly reach that limit if you add too many images.

To add an image in your application, edit the `appinfo.json` file and add your image:

````js
{
  "type": "png",
  "name": "IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER",
  "file": "images/your_image.png"
}
````

> If you are using CloudPebble, you can add images in your project configuration.

To reference your image in Pebble.js, you can use the `name` field or the `file` field.

````js
// These two examples are both valid ways to show the image declared above in a Card
card.icon('images/your_image.png');
card.icon('IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER');
````

You can also display images with [Image] when using a dynamic [Window].

````js
// This is an example of using an image with Image and Window
var UI = require('ui');
var Vector2 = require('vector2');

var wind = new UI.Window({ fullscreen: true });
var image = new UI.Image({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  image: 'images/your_image.png'
});
wind.add(image);
wind.show();
````

## Using Fonts
[Using Fonts]: #using-fonts

You can use any of the Pebble system fonts in your Pebble.js applications. Please refer to [this Pebble Developer's blog post](https://developer.pebble.com/blog/2013/07/24/Using-Pebble-System-Fonts/) for a list of all the Pebble system fonts. When referring to a font, using lowercase with dashes is recommended. For example, `GOTHIC_18_BOLD` becomes `gothic-18-bold`.

````js
var Vector2 = require('vector2');

var wind = new UI.Window();
var textfield = new UI.Text({
 position: new Vector2(0, 0),
 size: new Vector2(144, 168),
 font: 'gothic-18-bold',
 text: 'Gothic 18 Bold'
});
wind.add(textfield);
wind.show();
````

## Using Color
[Using Color]: #using-color

You can use color in your Pebble.js applications by specifying them in the supported [Color Formats]. Use the [Pebble Color Picker](https://developer.pebble.com/guides/tools-and-resources/color-picker/) to find colors to use. Be sure to maintain [Readability and Contrast] when developing your application.

### Color Formats
[Color Formats]: #color-formats

Color can be specified in various ways in your Pebble.js application. The formats are named string, hexadecimal string, and hexadecimal number. Each format has different benefits.

The following table includes examples of all the supported formats in Pebble.js:

| Color Format                    | Examples                   |
| ------------                    | :------:                   |
| Named String                    | `'green', 'sunset-orange'` |
| Hexadecimal String              | `'#00ff00', '#ff5555'`     |
| Hexadecimal String (with alpha) | `'#ff00ff00', '#ffff5555'` |
| Hexadecimal Number              | `0x00ff00, 0xff5555`       |
| Hexadecimal Number (with alpha) | `0xff00ff00, 0xffff5555`   |

**Named strings** are convenient to remember and read more naturally. They however cannot have the alpha channel be specified with the exception of the named string color `'clear'`. All other named colors are at max opacity. Named colors can also be specified in multiple casing styles, such as hyphenated lowercase `'sunset-orange'`, C constant `'SUNSET_ORANGE'`, Pascal `'SunsetOrange'`, or camel case `'sunsetOrange'`. Use the casing most convenient for you, but do so consistently across your own codebase.

**Hexadecimal strings** can be used for specifying the exact color desired as Pebble.js will automatically round the color to the supported color of the current platform. Two hexadecimal digits are used to represent the three color channels red, green, blue in that order.

**Hexadecimal strings (with alpha)** specified with eight digits are parsed as having an alpha channel specified in the first two digits where `00` is clear and `ff` is full opacity.

**Hexadecimal numbers** can be manipulated directly with the arithmetic and bitwise operators. This is also the format which the configurable framework Clay uses.

**Hexadecimal numbers (with alpha)** also have an alpha channel specified, but it is recommended to use hexadecimal strings instead for two reasons. The first reason is that `00` also represents full opacity since they are equivalent to six digit hexadecimal numbers which are implicitly at full opacity. The second is that when explicitly representing full opacity as `ff`, some integer logic can cause a signed overflow, resulting in negative color values. Intermediate alpha channels such as `55` or `aa` have no such caveats.

Various parts of the Pebble.js API support color. Parameters of the type Color can take any of the color formats mentioned in the above table.

````js
var UI = require('ui');

var card = new UI.Card({
  title: 'Using Color',
  titleColor: 'sunset-orange', // Named string
  subtitle: 'Color',
  subtitleColor: '#00dd00', // 6-digit Hexadecimal string
  body: 'Format',
  bodyColor: 0x9a0036 // 6-digit Hexadecimal number
});

card.show();
````

### Readability and Contrast
[Readability and Contrast]: #readability-and-contrast

When using color or not, be mindful that your users may not have a Pebble supporting color or the reverse. Black and white Pebbles will display colors with medium luminance as a gray checkered pattern which makes text of any color difficult to read. In Pebble.js, you can use [Feature.color()] to use a different value depending on whether color is supported.

````js
var UI = require('ui');
var Feature = require('platform/feature');

var card = new UI.Card({
  title: 'Using Color',
  titleColor: Feature.color('sunset-orange', 'black'),
  subtitle: 'Readability',
  subtitleColor: Feature.color('#00dd00', 'black'),
  body: 'Contrast',
  bodyColor: Feature.color(0x9a0036, 'black'),
  backgroundColor: Feature.color('light-gray', 'white'),
});

card.show();
````

Whether you have a color Pebble or not, you will want to test your app in all platforms. You can see how your app looks in multiple platforms with the following local SDK command or by changing the current platform in CloudPebble.

> `pebble build && pebble install --emulator=aplite && pebble install --emulator=basalt && pebble install --emulator=chalk`

Using too much color such as in the previous example can be overwhelming however. Just using one color that stands out in a single place can have a more defined effect and remain readable.

````js
var card = new UI.Card({
  status: {
    color: 'white',
    backgroundColor: Feature.color('electric-ultramarine', 'black'),
    separator: 'none',
  },
  title: 'Using Color',
  subtitle: 'Readability',
  body: 'Contrast',
});
````

Likewise, if introducing an action bar, you can remove all color from the status bar and instead apply color to the action bar.

````js
var card = new UI.Card({
  status: true,
  action: {
    backgroundColor: Feature.color('jazzberry-jam', 'black'),
  },
  title: 'Dialog',
  subtitle: 'Action',
  body: 'Button',
});
````

When changing the background color, note that the status bar also needs its background color changed too if you would like it to match.

````js
var backgroundColor = Feature.color('light-gray', 'black');
var card = new UI.Card({
  status: {
    backgroundColor: backgroundColor,
    separator: Feature.round('none', 'dotted'),
  },
  action: {
    backgroundColor: 'black',
  },
  title: 'Music',
  titleColor: Feature.color('orange', 'black'),
  subtitle: 'Playing',
  body: 'Current Track',
  backgroundColor: backgroundColor,
});
````

For a menu, following this style of coloring, you would only set the `highlightBackgroundColor`.

````js
var menu = new UI.Menu({
  status: {
    separator: Feature.round('none', 'dotted'),
  },
  highlightBackgroundColor: Feature.color('vivid-violet', 'black'),
  sections: [{
    items: [{ title: 'One', subtitle: 'Using Color' },
            { title: 'Color', subtitle: 'Color Formats' },
            { title: 'Hightlight', subtitle: 'Readability' }],
  }],
});

menu.show();
````

In the examples above, mostly black text on white or light gray is used which has the most contrast. Try to maintain this amount of contrast with text. Using dark gray on light gray for example can be unreadable at certain angles in the sunlight or in darkly lit areas.

## Feature Detection
[Feature Detection]: #feature-detection

Pebble.js provides the [Feature] module so that you may perform feature detection. This allows you to change the presentation or behavior of your application based on the capabilities or characteristics of the current Pebble watch that the user is running your application with.

### Using Feature
[Using Feature]: #using-feature

During the development of your Pebble.js application, you will want to test your application on all platforms. You can use the following local SDK command or change the current platform in CloudPebble.

> `pebble build && pebble install --emulator=aplite && pebble install --emulator=basalt && pebble install --emulator=chalk`

You'll notice that there are a few differing capabilities across platforms, such as having color support or having a round screen. You can use [Feature.color()] and [Feature.round()] respectively in order to test for these capabilities. Most capability functions also have a direct opposite, such as [Feature.blackAndWhite()] and [Feature.rectangle()] respectively.

The most common way to use [Feature] capability functions is to pass two parameters.

````js
var UI = require('ui');
var Feature = require('platform/feature');

// Use 'red' if round, otherwise use 'blue'
var color = Feature.round('red', 'blue');

var card = new UI.Card({
  title: 'Color',
  titleColor: color,
});

card.show();
````

You can also call the [Feature] capability functions with no arguments. In these cases, the function will return either `true` or `false` based on whether the capability exists.

````js
if (Feature.round()) {
  // Perform round-only logic
  console.log('This is a round device.');
}
````

Among all Pebble platforms, there are characteristics that exist on all platforms, such as the device resolution and the height of the status bar. [Feature] also provides methods which gives additional information about these characteristics, such as [Feature.resolution()] and [Feature.statusBarHeight()].

````js
var res = Feature.resolution();
console.log('Current display height is ' + res.y);
````

Check out the [Feature] API Reference for all the capabilities it detects and characteristics it offers.

### Feature vs Platform
[Feature vs Platform]: #feature-vs-platform

Pebble.js offers both [Feature] detection and [Platform] detection which are different. When do you use [Feature] detection instead of just changing the logic based on the current [Platform]? Using feature detection allows you to minimize the concerns of your logic, allowing each section of logic to be a single unit that does not rely on anything else unrelated.

Consider the following [Platform] detection logic:

````js
var UI = require('ui');
var Platform = require('platform');

var isAplite = (Platform.version() === 'aplite');
var isChalk = (Platform.version() === 'chalk');
var card = new UI.Card({
  title: 'Example',
  titleColor: isAplite ? 'black' : 'dark-green',
  subtitle: isChalk ? 'Hello World!' : 'Hello!',
  body: isAplite ? 'Press up or down' : 'Speak to me',
});

card.show();
````

The first issue has to do with future proofing. It is checking if the current Pebble has a round screen by seeing if it is on Chalk, however there may be future platforms that have round screens. It can instead use [Feature.round()] which will update to include newer platforms as they are introduced.

The second issue is unintentional entanglement of different concerns. In the example above, `isAplite` is being used to both determine whether the Pebble is black and white and whether there is a microphone. It is harmless in this small example,  but when the code grows, it could potentially change such that a function both sets up the color and interaction based on a single boolean `isAplite`. This mixes color presentation logic with interaction logic.

Consider the same example using [Feature] detection instead:

````js
var UI = require('ui');
var Feature = require('platform/feature');

var card = new UI.Card({
  title: 'Example',
  titleColor: Feature.color('dark-green', 'black'),
  subtitle: Feature.round( 'Hello World!', 'Hello!'),
  body: Feature.microphone('Speak to me', 'Press up or down'),
});

card.show();
````

Now, if it is necessary to separate the different logic in setting up the card, the individual units can be implemented in separate functions without anything unintentionally mixing the logic together. [Feature] is provided as a module, so it is always available where you decide to move your logic.

The two examples consist of units of logic that consist of one liners, but if each line was instead large blocks of logic with the `isAplite` boolean used throughout, the entanglement issue would be more difficult to remove from your codebase, hence the recommendation to use [Feature] detection. Of course, for capabilities or characteristics that [Feature] is unable to allow you to discern, use [Platform].

# API Reference
[API Reference]: #api-reference

## Global namespace

### require(path)

Loads another JavaScript file allowing you to write a multi-file project. Package loading loosely follows the CommonJS format. `path` is the path to the dependency.

````js
// src/js/dependency.js
var dep = require('dependency');
````

Exporting is possible by modifying or setting `module.exports` within the required file. The module path is also available as `module.filename`. `require` will look for the module relative to the loading module, the root path, and the Pebble.js library folder `lib` located at `src/js/lib`.

### Pebble

The `Pebble` object from [PebbleKit JavaScript](https://developer.pebble.com/guides/pebble-apps/pebblekit-js/) is available as a global variable. Some of the methods it provides have Pebble.js equivalents. When available, it is recommended to use the Pebble.js equivalents as they have more documented features and cleaner interfaces.

This table lists the current Pebble.js equivalents:

| Pebble API                                          | Pebble.js Equivalent                                     |
| ------------                                        | :------:                                                 |
| `Pebble.addEventListener('ready', ...)`             | Your application automatically starts after it is ready. |
| `Pebble.addEventListener('showConfiguration', ...)` | [Settings.config()]                                      |
| `Pebble.addEventListener('webviewclosed', ...)`     | [Settings.config()] with close handler.                  |

Use `Pebble` when there is no Pebble.js alternative. Currently, these are the `Pebble` methods that have no direct Pebble.js alternative:

| Pebble API without Equivalents    | Note                                                                   |
| ------------                      | :---:                                                                  |
| `Pebble.getAccountToken()`        |                                                                        |
| `Pebble.getActiveWatchInfo()`     | Use [Platform.version()] if only querying for the platform version.    |
| `Pebble.getTimelineToken()`       |                                                                        |
| `Pebble.getWatchToken()`          |                                                                        |
| `Pebble.showSimpleNotificationOnPebble()` | Consider presenting a [Card] or using Pebble Timeline instead. |
| `Pebble.timelineSubscribe()`      |                                                                        |
| `Pebble.timelineSubscriptions()`  |                                                                        |
| `Pebble.timelineUnsubscribe()`    | &nbsp;                                                                 |

### localStorage

`localStorage` is [available for your use](https://developer.pebble.com/guides/communication/using-pebblekit-js/#using-localstorage), but consider using the [Settings] module instead which provides an alternative interface that can save and load JavaScript objects for you.

````js
var Settings = require('settings');

Settings.data('playerInfo', { id: 1, name: 'Gordon Freeman' });
var playerInfo = Settings.data('playerInfo');
console.log("Player's name is " + playerInfo.name);
````

### XMLHttpRequest

`XMLHttpRequest` is [available for your use](https://developer.pebble.com/guides/communication/using-pebblekit-js/#using-xmlhttprequest), but consider using the [ajax] module instead which provides a jQuery-like ajax alternative to performing asynchronous and synchronous HTTP requests, with built in support for forms and headers.

````js
var ajax = require('ajax');

ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
  function(data, status, req) {
    console.log('Quote of the day is: ' + data.contents.quotes[0].quote);
  }
);
````

### window -- browser

A `window` object is provided with a subset of the standard APIs you would find in a normal browser. Its direct usage is discouraged because available functionalities may differ between the iOS and Android runtime environment. 

More specifically:

 - XHR and WebSocket are supported on iOS and Android
 - The `<canvas>` element is not available on iOS

If in doubt, please contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com).

## Clock
[Clock]: #clock

The Clock module makes working with the [Wakeup] module simpler with its provided time utility functions.

### Clock

`Clock` provides a single module of the same name `Clock`.

````js
var Clock = require('clock');
````

<a id="clock-weekday"></a>
#### Clock.weekday(weekday, hour, minute[, seconds])
[Clock.weekday]: #clock-weekday

Calculates the seconds since the epoch until the next nearest moment of the given weekday and time parameters. `weekday` can either be a string representation of the weekday name such as `sunday`, or the 0-based index number, such as 0 for sunday. `hour` is a number 0-23 with 0-12 indicating the morning or a.m. times. `minute` and `seconds` numbers 0-59. `seconds` is optional.

The weekday is always the next occurrence and is not limited by the current week. For example, if today is Wednesday, and `'tuesday'` is given for `weekday`, the resulting time will be referring to Tuesday of next week at least 5 days from now. Similarly, if today is Wednesday and `'Thursday'` is given, the time will be referring to tomorrow, the Thursday of the same week, between 0 to 2 days from now. This is useful for specifying the time for [Wakeup.schedule].

````js
// Next Tuesday at 6:00 a.m.
var nextTime = Clock.weekday('tuesday', 6, 0);
console.log('Seconds until then: ' + (nextTime - Date.now()));

var Wakeup = require('wakeup');

// Schedule a wakeup event.
Wakeup.schedule(
  { time: nextTime },
  function(e) {
    if (e.failed) {
      console.log('Wakeup set failed: ' + e.error);
    } else {
      console.log('Wakeup set! Event ID: ' + e.id);
    }
  }
)
````

## Platform
[Platform]: #platform

`Platform` provides a module of the same name `Platform` and a feature detection module [Feature].


### Platform

The Platform module allows you to determine the current platform runtime on the watch through its `Platform.version` method. This is to be used when the [Feature] module does not give enough ability to discern whether a feature exists or not.

````js
var Platform = require('platform');
````

<a id="platform-version"></a>
#### Platform.version()
[Platform.version()]: #platform-version

`Platform.version` returns the current platform version name as a lowercase string. This can be `'aplite'`, `'basalt'`, or `'chalk'`. Use the following table to determine the platform that `Platform.version` will return.

| Watch Model          | Platform   |
| ----                 | :----:     |
| Pebble Classic       | `'aplite'` |
| Pebble Steel Classic | `'aplite'` |
| Pebble Time          | `'basalt'` |
| Pebble Time Steel    | `'basalt'` |
| Pebble Time Round    | `'chalk'`  |

````js
console.log('Current platform is ' + Platform.version());
````

### Feature
[Feature]: #feature

The Feature module under Platform allows you to perform feature detection, adjusting aspects of your application to the capabilities of the current watch model it is current running on. This allows you to consider the functionality of your application based on the current set of available capabilities or features. The Feature module also provides information about features that exist on all watch models such as `Feature.resolution` which returns the resolution of the current watch model.

````js
var Feature = require('platform/feature');

console.log('Color is ' + Feature.color('avaiable', 'not available'));
console.log('Display width is ' + Feature.resolution().x);
````

<a id="feature-color"></a>
#### Feature.color([yes, no])
[Feature.color()]: #feature-color

`Feature.color` will return the `yes` parameter if color is supported and `no` if it is not. This is the opposite of [Feature.blackAndWhite()]. When given no parameters, it will return true or false respectively.

````js
var textColor = Feature.color('oxford-blue', 'black');

if (Feature.color()) {
  // Perform color-only operation
  console.log('Color supported');
}
````

<a id="feature-blackAndWhite"></a>
#### Feature.blackAndWhite([yes, no])
[Feature.blackAndWhite()]: #feature-blackAndWhite

`Feature.blackAndWhite` will return the `yes` parameter if only black and white is supported and `no` if it is not. This is the opposite of [Feature.color()]. When given no parameters, it will return true or false respectively.

````js
var backgroundColor = Feature.blackAndWhite('white', 'clear');

if (Feature.blackAndWhite()) {
  // Perform black-and-white-only operation
  console.log('Black and white only');
}
````

<a id="feature-rectangle"></a>
#### Feature.rectangle([yes, no])
[Feature.rectangle()]: #feature-rectangle

`Feature.rectangle` will return the `yes` parameter if the watch screen is rectangular and `no` if it is not. This is the opposite of [Feature.round()]. When given no parameters, it will return true or false respectively.

````js
var margin = Feature.rectangle(10, 20);

if (Feature.rectangle()) {
  // Perform rectangular display only operation
  console.log('Rectangular display');
}
````

<a id="feature-round"></a>
#### Feature.round([yes, no])
[Feature.round()]: #feature-round

`Feature.round` will return the `yes` parameter if the watch screen is round and `no` if it is not. This is the opposite of [Feature.rectangle()]. When given no parameters, it will return true or false respectively.

````js
var textAlign = Feature.round('center', 'left');

if (Feature.round()) {
  // Perform round display only operation
  console.log('Round display');
}
````

#### Feature.microphone([yes, no])

`Feature.microphone` will return the `yes` parameter if the watch has a microphone and `no` if it does not. When given no parameters, it will return true or false respectively. Useful for determining whether the `Voice` module will allow transcription or not and changing the UI accordingly.

````js
var text = Feature.microphone('Say your command.',
                              'Select your command.');

if (Feature.microphone()) {
  // Perform microphone only operation
  console.log('Microphone available');
}
````

<a id="feature-resolution"></a>
#### Feature.resolution()
[Feature.resolution()]: #feature-resolution

`Feature.resolution` returns a [Vector2] containing the display width as the `x` component and the display height as the `y` component. Use the following table to determine the resolution that `Feature.resolution` will return on a given platform.

| Platform | Width | Height | Note                                                                                              |
| ----     | :---: | :----: | ------                                                                                            |
| aplite   | 144   | 168    |                                                                                                   |
| basalt   | 144   | 168    | This is a rounded rectangle, therefore there is small set of pixels at each corner not available. |
| chalk    | 180   | 180    | This is a circular display, therefore not all pixels in a 180 by 180 square are available.        |

**NOTE:** [Window]s also have a [Window.size()] method which returns its size as a [Vector2]. Use [Window.size()] when possible.

````js
var res = Feature.resolution();
console.log('Current display is ' + res.x + 'x' + res.y);
````

#### Feature.actionBarWidth()

`Feature.actionBarWidth` returns the action bar width based on the platform. This is `30` for rectangular displays and `40` for round displays. Useful for determining the remaining screen real estate in a dynamic [Window] with an action bar visible.

````js
var rightMargin = Feature.actionBarWidth() + 5;
var elementWidth = Feature.resolution().x - rightMargin;
````

**NOTE:** [Window.size()] already takes the action bar into consideration, so use it instead when possible.

<a id="feature-statusBarHeight"></a>
#### Feature.statusBarHeight()
[Feature.statusBarHeight()]: #feature-statusBarHeight

`Feature.statusBarHeight` returns the status bar height. This is `16` and can change accordingly if the Pebble Firmware theme ever changes. Useful for determining the remaining screen real estate in a dynamic [Window] with a status bar visible.

````js
var topMargin = Feature.statusBarHeight() + 5;
var elementHeight = Feature.resolution().y - topMargin;
````

**NOTE:** [Window.size()] already takes the status bar into consideration, so use it instead when possible.

## Settings
[Settings]: #settings

The Settings module allows you to add a configurable web view to your application and share options with it. Settings also provides two data accessors `Settings.option` and `Settings.data` which are backed by localStorage. Data stored in `Settings.option` is automatically shared with the configurable web view.

### Settings

`Settings` provides a single module of the same name `Settings`.

````js
var Settings = require('settings');
````

<a id="settings-config"></a>
#### Settings.config(options, [open,] close)
[Settings.config()]: #settings-config

`Settings.config` registers your configurable for use along with `open` and `close` handlers.

`options` is an object with the following parameters:

| Name       | Type    | Argument   | Default   | Description                                                                        |
| ----       | :----:  | :--------: | --------- | -------------                                                                      |
| `url`      | string  |            |           | The URL to the configurable. e.g. 'http://www.example.com?name=value'              |
| `autoSave` | boolean | (optional) | true      | Whether to automatically save the web view response to options                     |
| `hash`     | boolean | (optional) | true      | Whether to automatically concatenate the URI encoded json `Settings` options to the URL as the hash component. |

`open` is an optional callback used to perform any tasks before the webview is open, such as managing the options that will be passed to the web view.

````js
// Set a configurable with the open callback
Settings.config(
  { url: 'http://www.example.com' },
  function(e) {
    console.log('opening configurable');

    // Reset color to red before opening the webview
    Settings.option('color', 'red');
  },
  function(e) {
    console.log('closed configurable');
  }
);
````

`close` is a callback that is called when the webview is closed via `pebblejs://close`. Any arguments passed to `pebblejs://close` is parsed and passed as options to the handler. `Settings` will attempt to parse the response first as URI encoded json and second as form encoded data if the first fails.

````js
// Set a configurable with just the close callback
Settings.config(
  { url: 'http://www.example.com' },
  function(e) {
    console.log('closed configurable');

    // Show the parsed response
    console.log(JSON.stringify(e.options));

    // Show the raw response if parsing failed
    if (e.failed) {
      console.log(e.response);
    }
  }
);
````

To pass options from your configurable to `Settings.config` `close` in your webview, URI encode your options json as the hash to `pebblejs://close`. This will close your configurable, so you would perform this action in response to the user submitting their changes.

````js
var options = { color: 'white', border: true };
document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(options));
````

#### Settings.option

`Settings.option` is a data accessor built on localStorage that shares the options with the configurable web view.

#### Settings.option(field, value)

Saves `value` to `field`. It is recommended that `value` be either a primitive or an object whose data is retained after going through `JSON.stringify` and `JSON.parse`.

````js
Settings.option('color', 'red');
````

If `value` is undefined or null, the field will be deleted.

````js
Settings.option('color', null);
````

#### Settings.option(field)

Returns the value of the option in `field`.

````js
var player = Settings.option('player');
console.log(player.id);
````

#### Settings.option(options)

Sets multiple options given an `options` object.

````js
Settings.option({
  color: 'blue',
  border: false,
});
````

#### Settings.option()

Returns all options. The returned options can be modified, but if you want the modifications to be saved, you must call `Settings.option` as a setter.

````js
var options = Settings.option();
console.log(JSON.stringify(options));

options.counter = (options.counter || 0) + 1;

// Modifications are not saved until `Settings.option` is called as a setter
Settings.option(options);
````

#### Settings.data

`Settings.data` is a data accessor similar to `Settings.option` except it saves your data in a separate space. This is provided as a way to save data or options that you don't want to pass to a configurable web view.

While localStorage is still accessible, it is recommended to use `Settings.data`.

#### Settings.data(field, value)

Saves `value` to `field`. It is recommended that `value` be either a primitive or an object whose data is retained after going through `JSON.stringify` and `JSON.parse`.

````js
Settings.data('player', { id: 1, x: 10, y: 10 });
````

If `value` is undefined or null, the field will be deleted.

````js
Settings.data('player', null);
````

#### Settings.data(field)

Returns the value of the data in `field`.

````js
var player = Settings.data('player');
console.log(player.id);
````

#### Settings.data(data)

Sets multiple data given an `data` object.

````js
Settings.data({
  name: 'Pebble',
  player: { id: 1, x: 0, y: 0 },
});
````

#### Settings.data()

Returns all data. The returned data can be modified, but if you want the modifications to be saved, you must call `Settings.data` as a setter.

````js
var data = Settings.data();
console.log(JSON.stringify(data));

data.counter = (data.counter || 0) + 1;

// Modifications are not saved until `Settings.data` is called as a setter
Settings.data(data);
````

## UI
[UI]: #ui

The UI framework contains all the classes needed to build the user interface of your Pebble applications and interact with the user.

### Accel
[Accel]: #accel

The `Accel` module allows you to get events from the accelerometer on Pebble.

You can use the accelerometer in two different ways:

 - To detect tap events. Those events are triggered when the user flicks his wrist or tap on the Pebble. They are the same events that are used to turn the Pebble back-light on. Tap events come with a property to tell you in which direction the Pebble was shook. Tap events are very battery efficient because they are generated directly by the accelerometer inside Pebble.
 - To continuously receive streaming data from the accelerometer. In this mode the Pebble will collect accelerometer samples at a specified frequency (from 10Hz to 100Hz), batch those events in an array and pass those to an event handler. Because the Pebble accelerometer needs to continuously transmit data to the processor and to the Bluetooth radio, this will drain the battery much faster.

````js
var Accel = require('ui/accel');
````

#### Accel.config(accelConfig)

This function configures the accelerometer `data` events to your liking. The `tap` event requires no configuration for use. Configuring the accelerometer is a very error prone process, so it is recommended to not configure the accelerometer and use `data` events with the default configuration without calling `Accel.config`.

`Accel.config` takes an `accelConfig` object with the following properties:

| Name        | Type    | Argument   | Default   | Description                                                                                                                                                                                                     |
| ----        | :----:  | :--------: | --------- | -------------                                                                                                                                                                                                   |
| `rate`      | number  | (optional) | 100       | The rate accelerometer data points are generated in hertz. Valid values are 10, 25, 50, and 100.                                                                                                                |
| `samples`   | number  | (optional) | 25        | The number of accelerometer data points to accumulate in a batch before calling the event handler. Valid values are 1 to 25 inclusive.                                                                          |
| `subscribe` | boolean | (optional) | automatic | Whether to subscribe to accelerometer data events. Accel.accelPeek cannot be used when subscribed. Pebble.js will automatically (un)subscribe for you depending on the amount of accelData handlers registered. |

The number of callbacks will depend on the configuration of the accelerometer. With the default rate of 100Hz and 25 samples, your callback will be called every 250ms with 25 samples each time.

**Important:** If you configure the accelerometer to send many `data` events, you will overload the bluetooth connection. We recommend that you send at most 5 events per second.

#### Accel.peek(callback)

Peeks at the current accelerometer value. The callback function will be called with the data point as an event.

````js
Accel.peek(function(e) {
  console.log('Current acceleration on axis are: X=' + e.accel.x + ' Y=' + e.accel.y + ' Z=' + e.accel.z);
});
````

#### Accel.on('tap', callback)

Subscribe to the `Accel` `tap` event. The callback function will be passed an event with the following fields:

 * `axis`: The axis the tap event occurred on: 'x', 'y', or 'z'.
 * `direction`: The direction of the tap along the axis: 1 or -1.

````js
Accel.on('tap', function(e) {
  console.log('Tap event on axis: ' + e.axis + ' and direction: ' + e.direction);
});
````

A [Window] may subscribe to the `Accel` `tap` event using the `accelTap` event type. The callback function will only be called when the window is visible.

````js
wind.on('accelTap', function(e) {
 console.log('Tapped the window');
});
````

#### Accel.on('data', callback)

Subscribe to the accel 'data' event. The callback function will be passed an event with the following fields:

 * `samples`: The number of accelerometer samples in this event.
 * `accel`: The first data point in the batch. This is provided for convenience.
 * `accels`: The accelerometer samples in an array.

One accelerometer data point is an object with the following properties:

| Property | Type    | Description                                                                                                                                                               |
| -------- | :----:  | ------------                                                                                                                                                              |
| `x`      | Number  | The acceleration across the x-axis (from left to right when facing your Pebble)                                                                                           |
| `y`      | Number  | The acceleration across the y-axis (from the bottom of the screen to the top of the screen)                                                                               |
| `z`      | Number  | The acceleration across the z-axis (going through your Pebble from the back side of your Pebble to the front side - and then through your head if Pebble is facing you ;) |
| `vibe`   | boolean | A boolean indicating whether Pebble was vibrating when this sample was measured.                                                                                          |
| `time`   | Number  | The amount of ticks in millisecond resolution when this point was measured.                                                                                               |

````js
Accel.on('data', function(e) {
  console.log('Just received ' + e.samples + ' from the accelerometer.');
});
````

A [Window] may also subscribe to the `Accel` `data` event using the `accelData` event type. The callback function will only be called when the window is visible.

````js
wind.on('accelData', function(e) {
 console.log('Accel data: ' + JSON.stringify(e.accels));
});
````

### Voice
[Voice]: #voice

The `Voice` module allows you to interact with Pebble's dictation API on supported platforms (Basalt and Chalk).

````js
var Voice = require('ui/voice');
````

#### Voice.dictate('start', [confirmDialog,] callback)

This function starts the dictation UI, and invokes the callback upon completion. The callback is passed an event with the following fields:

* `err`: A string describing the error, or `null` on success.
* `transcription`: The transcribed string.

An optional second parameter, `confirmDialog`, can be passed to the `Voice.dictate` method to control whether there should be a confirmation dialog displaying the transcription text after voice input. If `confirmDialog` is set to `false`, the confirmation dialog will be skipped. By default, there will be a confirmation dialog.

```js
// Start a diction session and skip confirmation
Voice.dictate('start', false, function(e) {
  if (e.err) {
    console.log('Error: ' + e.err);
    return;
  }

  main.subtitle('Success: ' + e.transcription);
});
```

**NOTE:** Only one dictation session can be active at any time. Trying to call `Voice.dicate('start', ...)` while another dictation session is in progress will result in the callback being called with an event having the error `"sessionAlreadyInProgress"`.

#### Voice.dictate('stop')

This function stops a dictation session that is currently in progress and prevents the session's callback from being invoked. If no session is in progress this method has no effect.

```js
Voice.dictate('stop');
```

### Window
[Window]: #window

`Window` is the basic building block in your Pebble.js application. All windows share some common properties and methods.

Pebble.js provides three types of Windows:

 * [Card]: Displays a title, a subtitle, a banner image and text on a screen. The position of the elements are fixed and cannot be changed.
 * [Menu]: Displays a menu on the Pebble screen. This is similar to the standard system menu in Pebble.
 * [Window]: The `Window` by itself is the most flexible. It allows you to add different [Element]s ([Circle], [Image], [Line], [Radial], [Rect], [Text], [TimeText]) and to specify a position and size for each of them. [Element]s can also be animated.

A `Window` can have the following properties:

| Name           | Type      | Default   | Description                                                                                     |
| ----           | :-------: | --------- | -------------                                                                                   |
| `clear`        | boolean   |           |                                                                                                 |
| `action`       | actionDef | None      | An action bar will be shown when configured with an `actionDef`.                                |
| `fullscreen`   | boolean   | false     | When true, the Pebble status bar will not be visible and the window will use the entire screen. |
| `scrollable`   | boolean   | false     | Whether the user can scroll this Window with the up and down button. When this is enabled, single and long click events on the up and down button will not be transmitted to your app. |

<a id="window-actiondef"></a>
#### Window actionDef
[Window actionDef]: #window-actiondef

A `Window` action bar can be displayed by setting its Window `action` property to an `actionDef`.

An `actionDef` has the following properties:

| Name              | Type      | Default   | Description                                                                                            |
| ----              | :-------: | --------- | -------------                                                                                          |
| `up`              | Image     | None      | An image to display in the action bar, next to the up button.                                          |
| `select`          | Image     | None      | An image to display in the action bar, next to the select button.                                      |
| `down`            | Image     | None      | An image to display in the action bar, next to the down button.                                        |
| `backgroundColor` | Color     | 'black'   | The background color of the action bar. You can set this to 'white' for windows with black backgrounds. |

````js
// Set action properties during initialization
var card = new UI.Card({
  action: {
    up: 'images/action_icon_plus.png',
    down: 'images/action_icon_minus.png'
  }
});

// Set action properties after initialization
card.action({
  up: 'images/action_icon_plus.png',
  down: 'images/action_icon_minus.png'
});

// Set a single action property
card.action('select', 'images/action_icon_checkmark.png');

// Disable the action bar
card.action(false);
````

You will need to add images to your project according to the [Using Images] guide in order to display action bar icons.

<a id="window-statusdef"></a>
#### Window statusDef
[Window statusDef]: #window-statusdef

A `Window` status bar can be displayed by setting its Window `status` property to a `statusDef`:

A `statusDef` has the following properties:

| Name              | Type      | Default   | Description                                                                                            |
| ----              | :-------: | --------- | -------------                                                                                          |
| `separator`       | string    | 'dotted'  | The separate between the status bar and the content of the window. Can be `'dotted'` or `'none'`.      |
| `color`           | Color     | 'black'   | The foreground color of the status bar used to display the separator and time text.                    |
| `backgroundColor` | Color     | 'white'   | The background color of the status bar. You can set this to 'black' for windows with white backgrounds. |

````js
// Set status properties during initialization
var card = new UI.Card({
  status: {
    color: 'white',
    backgroundColor: 'black'
  }
});

// Set status properties after initialization
card.status({
  color: 'white',
  backgroundColor: 'black'
});

// Set a single status property
card.status('separator', 'none');

// Disable the status bar
card.status(false);
````

#### Window.show()

This will push the window to the screen and display it. If user press the 'back' button, they will navigate to the previous screen.

#### Window.hide()

This hides the window.

If the window is currently displayed, this will take the user to the previously displayed window.

If the window is not currently displayed, this will remove it from the window stack. The user will not be able to get back to it with the back button.

````js
var splashScreen = new UI.Card({ banner: 'images/splash.png' });
splashScreen.show();

var mainScreen = new UI.Menu();

setTimeout(function() {
  // Display the mainScreen
  mainScreen.show();
  // Hide the splashScreen to avoid showing it when the user press Back.
  splashScreen.hide();
}, 400);
````

#### Window.on('click', button, handler)

Registers a handler to call when `button` is pressed.

````js
wind.on('click', 'up', function() {
  console.log('Up clicked!');
});
````

You can register a handler for the 'up', 'select', 'down', and 'back' buttons.

**Note:** You can also register button handlers for `longClick`.

#### Window.on('longClick', button, handler)

Just like `Window.on('click', button, handler)` but for 'longClick' events.

#### Window.on('show', handler)

Registers a handler to call when the window is shown. This is useful for knowing when a user returns to your window from another. This event is also emitted when programmatically showing the window. This does not include when a Pebble notification popup is exited, revealing your window.

````js
// Define the handler before showing.
wind.on('show', function() {
  console.log('Window is shown!');
});

// The show event will emit, and the handler will be called.
wind.show();
````

#### Window.on('hide', handler)

Registers a handler to call when the window is hidden. This is useful for knowing when a user exits out of your window or when your window is no longer visible because a different window is pushed on top. This event is also emitted when programmatically hiding the window. This does not include when a Pebble notification popup obstructs your window.

It is recommended to use this instead of overriding the back button when appropriate.

````js
wind.on('hide', function() {
  console.log('Window is hidden!');
});
````

#### Window.action(actionDef)

Nested accessor to the `action` property which takes an `actionDef`. Used to configure the action bar with a new `actionDef`. See [Window actionDef].

````js
card.action({
  up: 'images/action_icon_up.png',
  down: 'images/action_icon_down.png'
});
````

To disable the action bar after enabling it, `false` can be passed in place of an `actionDef`.

````js
// Disable the action bar
card.action(false);
````

#### Window.action(field, value)

`Window.action` can also be called with two arguments, `field` and `value`, to set specific fields of the window's `action` property. `field` is the name of a [Window actionDef] property as a string and `value` is the new property value.

````js
card.action('select', 'images/action_icon_checkmark.png');
````

#### Window.status(statusDef)

Nested accessor to the `status` property which takes a `statusDef`. Used to configure the status bar with a new `statusDef`. See [Window statusDef].

````js
card.status({
  color: 'white',
  backgroundColor: 'black'
});
````

To disable the status bar after enabling it, `false` can be passed in place of `statusDef`.

````js
// Disable the status bar
card.status(false);
````

Similarly, `true` can be used as a [Window statusDef] to represent a `statusDef` with all default properties.

````js
var card = new UI.Card({ status: true });
card.show();
````

#### Window.status(field, value)

`Window.status` can also be called with two arguments, `field` and `value`, to set specific fields of the window's `status` property. `field` is the name of a [Window statusDef] property as a string and `value` is the new property value.

````js
card.status('separator', 'none');
````

<a id="window-size"></a>
#### Window.size()
[Window.size()]: #window-size

`Window.size` returns the size of the max viewable content size of the window as a [Vector2] taking into account whether there is an action bar and status bar. A [Window] will return a size that is shorter than a [Window] without for example.

If the automatic consideration of the action bar and status bar does not satisfy your use case, you can use [Feature.resolution()] to obtain the Pebble's screen resolution as a [Vector2].

````js
var wind = new UI.Window({ status: true });

var size = wind.size();
var rect = new UI.Rect({ size: new Vector2(size.x / 4, size.y / 4) });
wind.add(rect);

wind.show();
````

### Window (dynamic)

A [Window] instantiated directly is a dynamic window that can display a completely customizable user interface on the screen. Dynamic windows are initialized empty and will need [Element]s added to it. [Card] and [Menu] will not display elements added to them in this way.

````js
// Create a dynamic window
var wind = new UI.Window();

// Add a rect element
var rect = new UI.Rect({ size: new Vector2(20, 20) });
wind.add(rect);

wind.show();
````

#### Window.add(element)

Adds an element to to the [Window]. The element will be immediately visible.

#### Window.insert(index, element)

Inserts an element at a specific index in the list of Element.

#### Window.remove(element)

Removes an element from the [Window].

#### Window.index(element)

Returns the index of an element in the [Window] or -1 if the element is not in the window.

#### Window.each(callback)

Iterates over all the elements on the [Window].

````js
wind.each(function(element) {
  console.log('Element: ' + JSON.stringify(element));
});
````

### Card
[Card]: #card

A Card is a type of [Window] that allows you to display a title, a subtitle, an image and a body on the screen of Pebble.

Just like any window, you can initialize a Card by passing an object to the constructor or by calling accessors to change the properties.

````js
var card = new UI.Card({
  title: 'Hello People!'
});
card.body('This is the content of my card!');
````

The properties available on a [Card] are:

| Name         | Type      | Default   | Description                                                                                                                                                          |
| ----         | :-------: | --------- | -------------                                                                                                                                                        |
| `title`      | string    | ''        | Text to display in the title field at the top of the screen                                                                                                          |
| `titleColor` | Color     | 'black'   | Text color of the title field                                                                                                                                             |
| `subtitle`   | string    | ''        | Text to display below the title                                                                                                                                      |
| `subtitleColor` | Color  | 'black'   | Text color of the subtitle field                                                                                                                                          |
| `body`       | string    | ''        | Text to display in the body field                                                                                                                                    |
| `bodyColor`  | Color     | 'black'   | Text color of the body field                                                                                                                                              |
| `icon`       | Image     | null      | An image to display before the title text. Refer to [Using Images] for instructions on how to include images in your app.                                            |
| `subicon`    | Image     | null      | An image to display before the subtitle text. Refer to [Using Images] for instructions on how to include images in your app.                                         |
| `banner`     | Image     | null      | An image to display in the center of the screen. Refer to [Using Images] for instructions on how to include images in your app.                                      |
| `scrollable` | boolean   | false     | Whether the user can scroll this card with the up and down button. When this is enabled, single and long click events on the up and down button will not be transmitted to your app. |
| `style`      | string    | 'small'   | Selects the font used to display the body. This can be 'small', 'large' or 'mono'                                                                                    |

A [Card] is also a [Window] and thus also has Window properties.

The `'small'` and `'large`' styles correspond to the system notification styles. `'mono'` sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art. The `'small'` and `'large'` styles were updated to match the Pebble firmware 3.x design during the 3.11 release. In order to use the older 2.x styles, you may specify `'classic-small'` and `'classic-large'`, however it is encouraged to use the newer styles.

Note that all text fields will automatically span multiple lines if needed and that you can use '\n' to insert line breaks.

### Menu
[Menu]: #menu

A menu is a type of [Window] that displays a standard Pebble menu on the screen of Pebble.

Just like any window, you can initialize a Menu by passing an object to the constructor or by calling accessors to change the properties.

The properties available on a [Menu] are:

| Name                        | Type    | Default | Description |
| ----                        |:-------:|---------|-------------|
| `sections`                  | Array   | `[]`    | A list of all the sections to display.            |
| `backgroundColor`           | Color   | `white` | The background color of a menu item.              |
| `textColor`                 | Color   | `black` | The text color of a menu item.                    |
| `highlightBackgroundColor`  | Color   | `black` | The background color of a selected menu item.     |
| `highlightTextColor`        | Color   | `white` | The text color of a selected menu item.           |

A menu contains one or more sections.

The properties available on a section are:

| Name                        | Type    | Default | Description |
| ----                        |:-------:|---------|-------------|
| `items`                     | Array   | `[]`    | A list of all the items to display.               |
| `title`                     | string  | ''      | Title text of the section header.                 |
| `backgroundColor`           | Color   | `white` | The background color of the section header.       |
| `textColor`                 | Color   | `black` | The text color of the section header.             |

Each section has a title and contains zero or more items. An item must have a title. Items can also optionally have a subtitle and an icon.

````js
var menu = new UI.Menu({
  backgroundColor: 'black',
  textColor: 'blue',
  highlightBackgroundColor: 'blue',
  highlightTextColor: 'black',
  sections: [{
    title: 'First section',
    items: [{
      title: 'First Item',
      subtitle: 'Some subtitle',
      icon: 'images/item_icon.png'
    }, {
      title: 'Second item'
    }]
  }]
});
````

#### Menu.section(sectionIndex, section)

Define the section to be displayed at `sectionIndex`. See [Menu] for the properties of a section.

````js
var section = {
  title: 'Another section',
  items: [{
    title: 'With one item'
  }]
};
menu.section(1, section);
````

When called with no `section`, returns the section at the given `sectionIndex`.

#### Menu.items(sectionIndex, items)

Define the items to display in a specific section. See [Menu] for the properties of an item.

````js
menu.items(0, [ { title: 'new item1' }, { title: 'new item2' } ]);
````

Whell called with no `items`, returns the items of the section at the given `sectionIndex`.

#### Menu.item(sectionIndex, itemIndex, item)

Define the item to display at index `itemIndex` in section `sectionIndex`. See [Menu] for the properties of an item.

````js
menu.item(0, 0, { title: 'A new item', subtitle: 'replacing the previous one' });
````

When called with no `item`, returns the item at the given `sectionIndex` and `itemIndex`.

#### Menu.selection(callback)

Get the currently selected item and section. The callback function will be passed an event with the following fields:

* `menu`: The menu object.
* `section`: The menu section object.
* `sectionIndex`: The section index of the section of the selected item.
* `item`: The menu item object.
* `itemIndex`: The item index of the selected item.

````js
menu.selection(function(e) {
  console.log('Currently selected item is #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
});
````

#### Menu.selection(sectionIndex, itemIndex)

Change the selected item and section.

````js
// Set the menu selection to the first section's third menu item
menu.selection(0, 2);
````

<a id="menu-on-select-callback"></a>
#### Menu.on('select', callback)
[Menu.on('select', callback)]: #menu-on-select-callback

Registers a callback called when an item in the menu is selected. The callback function will be passed an event with the following fields:

* `menu`: The menu object.
* `section`: The menu section object.
* `sectionIndex`: The section index of the section of the selected item.
* `item`: The menu item object.
* `itemIndex`: The item index of the selected item.

**Note:** You can also register a callback for 'longSelect' event, triggered when the user long clicks on an item.

````js
menu.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
});
````

#### Menu.on('longSelect', callback)

Similar to the select callback, except for long select presses. See [Menu.on('select', callback)].

### Element
[Element]: #element

There are seven types of [Element] that can be instantiated at the moment: [Circle], [Image], [Line], [Radial], [Rect], [Text], [TimeText].

Most elements share these common properties:

| Name              | Type      | Default   | Description                                                                    |
| ------------      | :-------: | --------- | -------------                                                                  |
| `position`        | Vector2   |           | Position of this element in the window.                                        |
| `size`            | Vector2   |           | Size of this element in this window. [Circle] uses `radius` instead.           |
| `borderWidth`     | number    | 0         | Width of the border of this element. [Line] uses `strokeWidth` instead.        |
| `borderColor`     | Color     | 'clear'   | Color of the border of this element. [Line] uses `strokeColor` instead.        |
| `backgroundColor` | Color     | 'white'   | Background color of this element. [Line] has no background.                    |

All properties can be initialized by passing an object when creating the Element, and changed with accessors functions that have the same name as the properties. Calling an accessor without a parameter will return the current value.

````js
var Vector2 = require('vector2');
var element = new Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
});
element.borderColor('white');
console.log('This element background color is: ' + element.backgroundColor());
````

#### Element.index()

Returns the index of the element in its [Window] or -1 if the element is not part of a window.

#### Element.remove()

Removes the element from its [Window].

#### Element.animate(animateDef, [duration=400])

The `position` and `size` are currently the only Element properties that can be animated. An `animateDef` is object with any supported properties specified. See [Element] for a description of those properties. The default animation duration is 400 milliseconds.

````js
// Use the element's position and size to avoid allocating more vectors.
var pos = element.position();
var size = element.size();

// Use the *Self methods to also avoid allocating more vectors.
pos.addSelf(size);
size.addSelf(size);

// Schedule the animation with an animateDef
element.animate({ position: pos, size: size });
````

Each element has its own animation queue. Animations are queued when `Element.animate` is called multiple times at once with the same element. The animations will occur in order, and the first animation will occur immediately. Note that because each element has its own queue, calling `Element.animate` across different elements will result all elements animating the same time. To queue animations across multiple elements, see [Element.queue(callback(next))].

When an animation begins, its destination values are saved immediately to the [Element].

`Element.animate` is chainable.

#### Element.animate(field, value, [duration=400])

You can also animate a single property by specifying a field by its name.

````js
var pos = element.position();
pos.y += 20;
element.animate('position', pos, 1000);
````

<a id="element-queue-callback-next"></a>
#### Element.queue(callback(next))
[Element.queue(callback(next))]: #element-queue-callback-next

`Element.queue` can be used to perform tasks that are dependent upon an animation completing, such as preparing the element for a different animation. `Element.queue` can also be used to coordinate animations across different elements. It is recommended to use `Element.queue` instead of a timeout if the same element will be animated after the custom task.

The `callback` you pass to `Element.queue` will be called with a function `next` as the first parameter. When `next` is called, the next item in the animation queue will begin. Items includes callbacks added by `Element.queue` or animations added by `Element.animate` before an animation is complete. Calling `next` is equivalent to calling `Element.dequeue`.

````js
element
  .animate('position', new Vector2(0, 0)
  .queue(function(next) {
    this.backgroundColor('white');
    next();
  })
  .animate('position', new Vector2(0, 50));
````

`Element.queue` is chainable.

#### Element.dequeue()

`Element.dequeue` can be used to continue executing items in the animation queue. It is useful in cases where the `next` function passed in `Element.queue` callbacks is not available. See [Element.queue(callback(next))] for more information on the animation queue.

#### Element.position(position)

Accessor to the `position` property. See [Element].

#### Element.size(size)

Accessor to the `size` property. See [Element].

#### Element.borderWidth(width)

Accessor to the `borderWidth` property. See [Element].

#### Element.borderColor(color)

Accessor to the `borderColor` property. See [Element].

#### Element.backgroundColor(color)

Accessor to the `backgroundColor` property. See [Element].

### Line
[Line]: #line

An [Element] that displays a line on the screen.

[Line] also has these additional properties:

| Name              | Type      | Default   | Description                                                                    |
| ------------      | :-------: | --------- | -------------                                                                  |
| `position2`       | Vector2   |           | Ending position of the line where `position` is the starting position.         |
| `strokeWidth`     | number    | 0         | Width of the line.                                                             |
| `strokeColor`     | Color     | 'clear'   | Color of the line.                                                             |

For clarity, [Line] has `strokeWidth` and `strokeColor` instead of `borderWidth` and `borderColor`.

````js
var wind = new UI.Window();

var line = new UI.Line({
  position: new Vector2(10, 10),
  position2: new Vector2(72, 84),
  strokeColor: 'white',
});

wind.add(line);
wind.show();
````

#### Line.position2(position)

Accessor to the `position2` ending position property. See [Line].

#### Line.strokeWidth(width)

Accessor to the `strokeWidth` property. See [Line].

#### Line.strokeColor(color)

Accessor to the `strokeColor` property. See [Line].

### Circle
[Circle]: #circle

An [Element] that displays a circle on the screen.

[Circle] also has the additional property `radius` which it uses for size rather than `size`. [Circle] is also different in that it positions its origin at the position, rather than anchoring by its top left. These differences are to keep the graphics operation characteristics that it is built upon.

````js
var wind = new UI.Window();

var circle = new UI.Circle({
  position: new Vector2(72, 84),
  radius: 25,
  backgroundColor: 'white',
});

wind.add(circle);
wind.show();
````

#### Circle.radius(radius)

Accessor to the `radius` property. See [Circle]

### Radial
[Radial]: #radial

An [Element] that can display as an arc, ring, sector of a circle depending on its properties are set.

[Radial] has these additional properties:

| Name              | Type      | Default   | Description                                                                                                                             |
| ------------      | :-------: | --------- | -------------                                                                                                                           |
| `radius`          | number    | 0         | Radius of the radial starting from its outer edge. A sufficiently large radius results in a sector or circle instead of an arc or ring. |
| `angle`           | number    | 0         | Starting angle in degrees. An arc or sector will be drawn from `angle` to `angle2`.                                                     |
| `angle2`          | number    | 360       | Ending angle in degrees. An ending angle that is 360 beyond the starting angle will result in a ring or circle.                         |

#### Radial.radius(radius)

Accessor to the `radius` property. See [Radial]

#### Radial.angle(angle)

Accessor to the `angle` starting angle property. See [Radial]

#### Radial.angle2(angle)

Accessor to the `angle2` ending angle property. See [Radial]

### Rect
[Rect]: #rect

An [Element] that displays a rectangle on the screen.

The [Rect] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                        |
| ------------      | :-------: | --------- | -------------                                                      |
| `backgroundColor` | string    | "white"   | Background color of this element ('clear', 'black' or 'white').    |
| `borderColor`     | string    | "clear"   | Color of the border of this element ('clear', 'black',or 'white'). |

### Text
[Text]: #text

An [Element] that displays text on the screen.

The [Text] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------      | :-------: | --------- | -------------                                                                                                                                                                                                                                                                                                                                              |
| `text`            | string    | ""        | The text to display in this element.                                                                                                                                                                                                                                                                                                                       |
| `font`            | string    |           | The font to use for that text element. See [Using Fonts] for more information on the different fonts available and how to add your own fonts.                                                                                                                                                                                                              |
| `color`           |           | 'white'   | Color of the text ('white', 'black' or 'clear').                                                                                                                                                                                                                                                                                                           |
| `textOverflow`    | 'string'  |           | How to handle text overflow in this text element ('wrap', 'ellipsis' or 'fill').                                                                                                                                                                                                                                                                           |
| `textAlign`       | 'string'  |           | How to align text in this element ('left', 'center' or 'right').                                                                                                                                                                                                                                                                                           |
| `borderColor`     | string    | 'clear'   | Color of the border of this element ('clear', 'black',or 'white').                                                                                                                                                                                                                                                                                         |
| `backgroundColor` | string    | 'clear'   | Background color of this element ('clear', 'black' or 'white').                                                                                                                                                                                                                                                                                            |

### TimeText
[TimeText]: #timetext

A [Text] element that displays time formatted text on the screen.

#### Displaying time in a TimeText element

If you want to display the current time or date, use the `TimeText` element with a time formatting string in the `text` property. The time to redraw the time text element will be automatically calculated based on the format string. For example, a `TimeText` element with the format `'%M:%S'` will be redrawn every second because of the seconds format `%S`.

The available formatting options follows the C `strftime()` function:

| Specifier   | Replaced by                                                                                                                                                | Example                    |
| ----------- | -------------                                                                                                                                              | ---------                  |
| %a          | An abbreviation for the day of the week.                                                                                                                   | "Thu"                      |
| %A          | The full name for the day of the week.                                                                                                                     | "Thursday"                 |
| %b          | An abbreviation for the month name.                                                                                                                        | "Aug"                      |
| %B          | The full name of the month.                                                                                                                                | "August"                   |
| %c          | A string representing the complete date and time                                                                                                           | "Mon Apr 01 13:13:13 1992" |
| %d          | The day of the month, formatted with two digits.                                                                                                           | "23"                       |
| %H          | The hour (on a 24-hour clock), formatted with two digits.                                                                                                  | "14"                       |
| %I          | The hour (on a 12-hour clock), formatted with two digits.                                                                                                  | "02"                       |
| %j          | The count of days in the year, formatted with three digits (from `001` to `366`).                                                                          | "235"                      |
| %m          | The month number, formatted with two digits.                                                                                                               | "08"                       |
| %M          | The minute, formatted with two digits.                                                                                                                     | "55"                       |
| %p          | Either `AM` or `PM` as appropriate.                                                                                                                        | "AM"                       |
| %S          | The second, formatted with two digits.                                                                                                                     | "02"                       |
| %U          | The week number, formatted with two digits (from `00` to `53`; week number 1 is taken as beginning with the first Sunday in a year). See also `%W`.        | "33"                       |
| %w          | A single digit representing the day of the week: Sunday is day 0.                                                                                          | "4"                        |
| %W          | Another version of the week number: like `%U`, but counting week 1 as beginning with the first Monday in a year.                                           | "34"                       |
| %x          | A string representing the complete date.                                                                                                                   | "Mon Apr 01 1992"          |
| %X          | A string representing the full time of day (hours, minutes, and seconds).                                                                                  | "13:13:13"                 |
| %y          | The last two digits of the year.                                                                                                                           | "01"                       |
| %Y          | The full year, formatted with four digits to include the century.                                                                                          | "2001"                     |
| %Z          | Defined by ANSI C as eliciting the time zone if available; it is not available in this implementation (which accepts `%Z` but generates no output for it). |                            |
| %%          | A single character, `%`.                                                                                                                                   | "%"                        |

#### Text.text(text)

Sets the text property. See [Text].

#### Text.font(font)

Sets the font property. See [Text].

#### Text.color(color)

Sets the color property. See [Text].

#### Text.textOverflow(textOverflow)

Sets the textOverflow property. See [Text].

#### Text.textAlign(textAlign)

Sets the textAlign property. See [Text].

#### Text.updateTimeUnit(updateTimeUnits)

Sets the updateTimeUnits property. See [Text].

#### Text.borderColor(borderColor)

Sets the borderColor property. See [Text].

#### Text.backgroundColor(backgroundColor)

Sets the backgroundColor property. See [Text].

### Image
[Image]: #image

An [Element] that displays an image on the screen.

The [Image] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------      | :-------: | --------- | -------------                                                                                                                                                                                                                                                                                                                                              |
| `image`           | string    | ""        | The resource name or path to the image to display in this element. See [Using Images] for more information and how to add your own images. |
| `compositing`     | string    | "normal"  | The compositing operation used to display the image. See [Image.compositing(compop)] for a list of possible compositing operations.                |


#### Image.image(image)

Sets the image property. See [Image].

<a id="image-compositing"></a>
#### Image.compositing(compop)
[Image.compositing(compop)]: #image-compositing

Sets the compositing operation to be used when rendering. Specify the compositing operation as a string such as `"invert"`. The following is a list of compositing operations available.

| Compositing | Description                                                            |
| ----------- | :--------------------------------------------------------------------: |
| `"normal"`  | Display the image normally. This is the default.                       |
| `"invert"`  | Display the image with inverted colors.                                |
| `"or"`      | White pixels are shown, black pixels are clear.                        |
| `"and"`     | Black pixels are shown, white pixels are clear.                        |
| `"clear"`   | The image's white pixels are painted as black, and the rest are clear. |
| `"set"`     | The image's black pixels are painted as white, and the rest are clear. |

### Vibe
[Vibe]: #vibe

`Vibe` allows you to trigger vibration on the user wrist.

#### Vibe.vibrate(type)

````js
var Vibe = require('ui/vibe');

// Send a long vibration to the user wrist
Vibe.vibrate('long');
````

| Name | Type | Argument | Default | Description |
| ---- |:----:|:--------:|---------|-------------|
| `type` | string | optional | `short` | The duration of the vibration. `short`, `long` or `double`. |

### Light
[Light]: #light

`Light` allows you to control the Pebble's backlight.
````js
var Light = require('ui/light');

// Turn on the light
Light.on('long');
````

#### Light.on()
Turn on the light indefinitely.

#### Light.auto()
Restore the normal behavior.

#### Light.trigger()
Trigger the backlight to turn on momentarily, just like if the user shook their wrist.

## Timeline
[Timeline]: #timeline

The Timeline module allows your app to handle a launch via a timeline action. This allows you to write a custom handler to manage launch events outside of the app menu. With the Timeline module, you can preform a specific set of actions based on the action which launched the app.

### Timeline

`Timeline` provides a single module of the same name `Timeline`.

````js
var Timeline = require('timeline');
````

<a id="timeline-launch"></a>
#### Timeline.launch(callback(event))
[Timeline.launch]: #timeline-launch

If you wish to change the behavior of your app depending on whether it was launched by a timeline event, and further configure the behavior based on the data associated with the timeline event, use `Timeline.launch` on startup. `Timeline.launch` will immediately call your launch callback asynchronously with a launch event detailing whether or not your app was launched by a timeline event.

````js
// Query whether we were launched by a timeline event
Timeline.launch(function(e) {
  if (e.action) {
    console.log('Woke up to timeline event: ' + e.launchCode + '!');
  } else {
    console.log('Regular launch not by a timeline event.');
  }
});
````

The `callback` will be called with a timeline launch event. The event has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `action`         | boolean | `true` if the app woke up by a timeline event, otherwise `false`. |
| `launchCode`     | number  | If woken by a timeline event, the code of the action. |

Note that this means you may have to move portions of your startup logic into the `Timeline.launch` callback or a function called by the callback. This can also add a very small delay to startup behavior because the underlying implementation must query the watch for the launch information.

## Wakeup
[Wakeup]: #wakeup

The Wakeup module allows you to schedule your app to wakeup at a specified time using Pebble's wakeup functionality. Whether the user is in a different watchface or app, your app will launch at the specified time. This allows you to write a custom alarm app, for example. If your app is already running, you may also subscribe to receive the wakeup event, which can be useful for more longer lived timers. With the Wakeup module, you can save data to be read on launch and configure your app to behave differently based on launch data. The Wakeup module, like the Settings module, is backed by localStorage.

### Wakeup

`Wakeup` provides a single module of the same name `Wakeup`.

````js
var Wakeup = require('wakeup');
````

<a id="wakeup-schedule"></a>
#### Wakeup.schedule(options, callback(event))
[Wakeup.schedule]: #wakeup-schedule

Schedules a wakeup event that will wake up the app at the specified time. `callback` will be immediately called asynchronously with whether the wakeup event was successfully set or not. Wakeup events cannot be scheduled within one minute of each other regardless of what app scheduled them. Each app may only schedule up to 8 wakeup events.

See [Clock.weekday] for setting wakeup events at particular times of a weekday.

````js
Wakeup.schedule(
  {
    // Set the wakeup event for one minute from now
    time: Date.now() / 1000 + 60,
    // Pass data for the app on launch
    data: { hello: 'world' }
  },
  function(e) {
    if (e.failed) {
      // Log the error reason
      console.log('Wakeup set failed: ' + e.error);
    } else {
      console.log('Wakeup set! Event ID: ' + e.id);
    }
  }
);
````

The supported `Wakeup.schedule` options are:

| Name             | Type    | Argument   | Default   | Description   |
| ----             | :----:  | :--------: | --------- | ------------- |
| `time`           | number  | required   |           | The time for the app to launch in seconds since the epoch as a number. Time can be specified as a Date object, but is not recommended due to timezone confusion. If using a Date object, no timezone adjustments are necessary if the phone's timezone is properly set. |
| `data`           | *       | optional   |           | The data to be saved for the app to read on launch. This is optional. See [Wakeup.launch]. Note that `data` is backed by localStorage and is thus saved on the phone. Data must be JSON serializable as it uses `JSON.stringify` to save the data. |
| `cookie`         | number  | optional   | 0         | A 32-bit unsigned integer to be saved for the app to read on launch. This is an optional alternative to `data` can also be used in combination. The integer is saved on the watch rather than the phone. |
| `notifyIfMissed` | boolean | optional   | false     | The user can miss a wakeup event if their watch is powered off. Specify `true` if you would like Pebble OS to notify them if they missed the event. |

Scheduling a wakeup event can result in errors. By providing a `callback`, you can inspect whether or not you have successfully set the wakeup event. The `callback` will be called with a wakeup set result event which has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | If successfully set, the wakeup event id. |
| `error`          | string  | On set failure, the type of error. |
| `failed`         | boolean | `true` if the event could not be set, otherwise `false`. |
| `data`           | number  | The custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | The custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |

Finally, there are multiple reasons why setting a wakeup event can fail. When a wakeup event fails to be set, `error` can be one of the following strings:

| Error               | Description   |
| -----               | ------------- |
| `'range'`           | Another wakeup event is already scheduled close to the requested time. |
| `'invalidArgument'` | The wakeup event was requested to be set in the past. |
| `'outOfResources'`  | The app already has the maximum of 8 wakeup events scheduled. |
| `'internal'`        | There was a Pebble OS error in scheduling the event. |

<a id="wakeup-launch"></a>
#### Wakeup.launch(callback(event))
[Wakeup.launch]: #wakeup-launch

If you wish to change the behavior of your app depending on whether it was launched by a wakeup event, and further configure the behavior based on the data associated with the wakeup event, use `Wakeup.launch` on startup. `Wakeup.launch` will immediately call your launch callback asynchronously with a launch event detailing whether or not your app was launched by a wakeup event.

If you require knowing when a wakeup event occurs while your app is already running, refer to [Wakeup.on('wakeup')] to register a wakeup callback that will be called for both launch wakeup events and wakeup events while already running.

````js
// Query whether we were launched by a wakeup event
Wakeup.launch(function(e) {
  if (e.wakeup) {
    console.log('Woke up to ' + e.id + '! data: ' + JSON.stringify(e.data));
  } else {
    console.log('Regular launch not by a wakeup event.');
  }
});
````

The `callback` will be called with a wakeup launch event. The event has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | If woken by a wakeup event, the wakeup event id. |
| `wakeup`         | boolean | `true` if the launch event is a wakeup event, otherwise `false`. |
| `launch`         | boolean | `true` if the launch was caused by this wakeup event, otherwise `false`. |
| `data`           | number  | If woken by a wakeup event, the custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | If woken by a wakeup event, the custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |

**Note:** You may have to move portions of your startup logic into the `Wakeup.launch` callback or a function called by the callback. This can also add a very small delay to startup behavior because the underlying implementation must query the watch for the launch information.

<a id="wakeup-on-wakeup"></a>
#### Wakeup.on('wakeup', handler)
[Wakeup.on('wakeup')]: #wakeup-on-wakeup

Registers a handler to call when a wakeup event occurs. This includes launch wakeup events and wakeup events while already running. See [Wakeup.launch] for the properties of the wakeup event object to be passed to the handler.

````js
// Single wakeup event handler example:
Wakeup.on('wakeup', function(e) {
  console.log('Wakeup event! ' + JSON.stringify(e));
});
````

If you want your wakeup handler to only receive wakeup events while already running, you can either test against the `.launch` boolean property, or use a wakeup launch handler to block the event from being sent to additional handlers. Wakeup events are sent to launch wakeup handlers first, then to general wakeup handlers next.

````js
// Single already-running example:
Wakeup.on('wakeup', function(e) {
  if (!e.launch) {
    console.log('Already-running wakeup: ' + JSON.stringify(e));
  }
});
````

**Note:** Returning false will also prevent further handlers of the same type from receiving the event.  Within each type of handlers, they are passed in registration order. The passing process ends if any handler returns false.

````js
// Launch + Already-running example:
// Launch wakeup handler
Wakeup.launch(function(e) {
  if (e.wakeup) {
    console.log('Launch wakeup: ' + JSON.stringify(e));
  }
  // Do not pass the event to additional handlers
  return false;
});

// Since the launch wakeup handler returns false,
// this becomes an already-running wakeup handler
Wakeup.on('wakeup', function(e) {
  console.log('Wakeup: ' + JSON.stringify(e));
});
````

<a id="wakeup-get"></a>
#### Wakeup.get(id)
[Wakeup.get]: #wakeup-get

Get the wakeup state information by the wakeup id. A wakeup state has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | The wakeup event id. |
| `time`           | number  | The time for the app to launch. This depends on the data type pass to [Wakeup.schedule]. If a Date object was passed, this can be a string because of localStorage. |
| `data`           | number  | The custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | The custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |
| `notifyIfMissed` | boolean | Whether it was requested for Pebble OS to notify the user if they missed the wakeup event. |

````js
var wakeup = Wakeup.get(wakeupId);
console.log('Wakeup info: ' + JSON.stringify(wakeup));
````

<a id="wakeup-each"></a>
#### Wakeup.each(callback(wakeup))
[Wakeup.each]: #wakeup-each

Loops through all scheduled wakeup events that have not yet triggered by calling the `callback` for each wakeup event. See [Wakeup.get] for the properties of the `wakeup` object to be passed to the callback.

````js
var numWakeups = 0;

// Query all wakeups
Wakeup.each(function(e) {
  console.log('Wakeup ' + e.id + ': ' + JSON.stringify(e));
  ++numWakeups;
});

main.body('Number of wakeups: ' + numWakeups);
````

#### Wakeup.cancel(id)

Cancels a particular wakeup event by id. The wakeup event id is obtained by the set result callback when setting a wakeup event. See [Wakeup.schedule].

#### Wakeup.cancel('all')

Cancels all wakeup events scheduled by your app. You can check what wakeup events are set before cancelling them all. See [Wakeup.each].

## Libraries

Pebble.js includes several libraries to help you write applications.

### ajax
[ajax]: #ajax

This module gives you a very simple and easy way to make HTTP requests.

````js
var ajax = require('ajax');

ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
  function(data) {
    console.log('Quote of the day is: ' + data.contents.quotes[0].quote);
  }
);
````

#### ajax(options, success, failure)

The supported options are:

| Name      | Type    | Argument   | Default   | Description                                                                                                                                                                   |
| ----      | :----:  | :--------: | --------- | -------------                                                                                                                                                                 |
| `url`     | string  |            |           | The URL to make the ajax request to. e.g. 'http://www.example.com?name=value'                                                                                                 |
| `method`  | string  | (optional) | get       | The HTTP method to use: 'get', 'post', 'put', 'delete', 'options', or any other standard method supported by the running environment.                                         |
| `type`    | string  | (optional) |           | The content and response format. By default, the content format is 'form' and response format is separately 'text'. Specifying 'json' will have ajax send `data` as json as well as parse the response as json. Specifying 'text' allows you to send custom formatted content and parse the raw response text. If you wish to send form encoded data and parse json, leave `type` undefined and use `JSON.decode` to parse the response data.
| `data`    | object  | (optional) |           | The request body, mainly to be used in combination with 'post' or 'put'. e.g. `{ username: 'guest' }`
| `headers` | object  | (optional) |           | Custom HTTP headers. Specify additional headers. e.g. `{ 'x-extra': 'Extra Header' }`
| `async`   | boolean | (optional) | true      | Whether the request will be asynchronous. Specify `false` for a blocking, synchronous request.
| `cache`   | boolean | (optional) | true      | Whether the result may be cached. Specify `false` to use the internal cache buster which appends the URL with the query parameter `_set` to the current time in milliseconds. |

The `success` callback will be called if the HTTP request is successful (when the status code is inside [200, 300) or 304). The parameters are the data received from the server, the status code, and the request object. If the option `type: 'json'` was set, the response will automatically be converted to an object, otherwise `data` is a string.

The `failure` callback is called when an error occurred. The parameters are the same as `success`.

### Vector2
[Vector2]: #vector2

A 2 dimensional vector. The constructor takes two parameters for the x and y values.

````js
var Vector2 = require('vector2');

var vec = new Vector2(144, 168);
````

For more information, see [Vector2 in the three.js reference documentation][three.js Vector2].
[three.js Vector2]: http://threejs.org/docs/#Reference/Math/Vector2

## Examples

Coming Soon!

## Acknowledgements

Pebble.js started as [Simply.JS](http://simplyjs.io), a project by [Meiguro](http://github.com/meiguro). It is now part of the Pebble SDK and supported by Pebble. Contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com) with any questions!

This documentation uses [Flatdoc](http://ricostacruz.com/flatdoc/#flatdoc).
