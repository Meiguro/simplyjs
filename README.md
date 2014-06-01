Pebble.js
=========

Pebble.js lets you write beautiful Pebble applications completely in JavaScript.

Pebble.js applications run on your phone. They have access to all the resources of your phone (Internet connectivity, GPS, almost unlimited memory, etc). Because they are written in JavaScript they are also perfect to make HTTP requests and connect your Pebble to the Internet.

> ![JSConf 2014](http://2014.jsconf.us/img/logo.png)
>
> Pebble.js was announced during JSConf 2014!

## Getting Started

 * In CloudPebble.net

   The easiest way to use Pebble.js is in [CloudPebble.net](http://www.cloudpebble.net). Select the 'Pebble.js' project type when creating a new project.

   [Build a Pebble.js application now in CloudPebble.net >](http://www.cloudpebble.net)

 * With the Pebble SDK

   This option allows you to customize Pebble.js. Follow the [Pebble SDK installation instructions](http://developer.getpebble.com/2/getting-started/) to install the SDK on your computer and [fork this project](http://github.com/pebble/pebblejs) on Github. 
   
   The main entry point for your application is in the `src/js/app.js` file.

   [Install the Pebble SDK on your computer >](http://developer.getpebble.com/2/getting-started/)


Pebble.js applications follow modern JavaScript best practices. To get started, you just need to call `require('ui')` to load the UI module and start building user interfaces.

````js
var UI = require('ui');
````

The basic block to build user interface is the [Card]. A Card is a type of [Window] that occupies the entire screen and allows you to display some text in a pre-structured way: a title at the top, a subtitle below it and a body area for larger paragraphs. Cards can be made scrollable to display large quantities of information. You can also add images next to the title, subtitle or in the body area.

````js
var window = new UI.Card({
  title: 'Hello World',
  body: 'This is your first Pebble app!',
  scrollable: true
});
````

After creating a window, push it onto the screen with the `show()` method.

````js
window.show();
````

To interact with the users, use the buttons or the accelerometer. Add callbacks to a window with the `.on()` method:

````js
window.on('click', function(e) {
  window.subtitle('Button ' + e.button + ' pressed.');
}
````

Making HTTP connections is very easy with the included `ajax` library.

````js
var ajax = require('ajax');
ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
  function(data) {
    window.body(data.contents.quote);
    window.title(data.contents.author);
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

You can use images in your Pebble.js application. Currently all images must be embedded in your applications. They will be resized and converted to black and white when you build your project.

We recommend that you follow these guidelines when preparing your images for Pebble:

 * Resize all images for the screen of Pebble. A fullscreen image will be 144 pixels wide by 168 pixels high.
 * Use an image editor or [HyperDither](http://www.tinrocket.com/hyperdither/) to dither your image in black and white.
 * Remember that the maximum size for a Pebble application is 100kB. You will quickly reach that limit if you add too many images.

To add an image in your application, edit the `appinfo.json` file and add your image:

````js
{
  "type": "png",
  "name": "IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER",
  "file": "images/your_image.png"
}
````

> If you are using CloudPebble, you can add images in your project configuration (coming soon!).

To reference your image in Pebble.js, you can use the `name` field or the `file` field.

````js
// These two examples are both valid ways to show the image declared above in a Card
card.icon('images/your_image.png');
card.icon('IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER');
````

## Using Fonts

You can use any of the Pebble system fonts in your Pebble.js applications. Please refer to [this Pebble Developer's blog post](https://developer.getpebble.com/blog/2013/07/24/Using-Pebble-System-Fonts/) for a list of all the Pebble system fonts.

````js
var Vector2 = require('vector2');
var stage = new UI.Stage();

var textfield = new UI.Text({
 position: Vector2(0, 0),
 size: Vector2(144, 168),
 font: 'GOTHIC_18_BOLD',
 text: 'Gothic 18 Bold'
});
stage.add(textfield);
stage.show();
````

## Examples

Coming Soon!

## Acknowledgements

Pebble.js started as [Simply.JS](http://www.simplyjs.io), a project by [Meiguro](http://github.com/meiguro). It is now part of the Pebble SDK and supported by Pebble. Contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com) with any questions!

This documentation uses [Flatdoc](http://ricostacruz.com/flatdoc/#flatdoc).

# API Reference

## Global namespace

### require(dependency)

Loads another JavaScript file allowing you to write a multi-file project. Package loading loosely follows the CommonJS format.

Exporting is possible by modifying or setting `module.exports` within the required file. The module path is also available as `module.path`. This currently only supports a relative path to another JavaScript file.

### Pebble

The `Pebble` object from [PebbleKit JavaScript](https://developer.getpebble.com/2/guides/javascript-guide.html) is available as a global variable. It's usage is discouraged in Pebble.js, instead you should use the objects documented below who provide a cleaner object interface to the same functionalities.

### window (global)

A `window` object is provided with a subset of the standard APIs you would find in a normal browser. It's direct usage is discouraged because available functionalities may differ between the iOS and Android runtime environment. 

More specifically:

 - XHR and WebSocket are supported on iOS and Android
 - The `<canvas>` element is not available on iOS

If in doubt, please contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com).

## UI

The UI framework contains all the classes needed to build the user interface of your Pebble applications and interact with the user.

### Accel

The `Accel` module allows you to get events from the accelerometer on Pebble.

You can use the accelerometer in two different ways:

 - To detect tap events. Those events are triggered when the user flicks his wrist or tap on the Pebble. They are the same events that are used to turn the Pebble back-light on. Tap events come with a property to tell you in which direction the Pebble was shook. Tap events are very battery efficient because they are generated directly by the accelerometer inside Pebble.
 - To continuously receive streaming data from the accelerometer. In this mode the Pebble will collect accelerometer samples at a specified frequency (from 10Hz to 100Hz), batch those events in an array and pass those to an event handler. Because the Pebble accelerometer needs to continuously transmit data to the processor and to the Bluetooth radio, this will drain the battery much faster.

````js
var Accel = require('ui/accel');
````

#### Accel.init()

Before you can use the accelerometer, you must call `Accel.init()`.

````js
Accel.init();
````

#### Accel.config(accelConfig)

This function configures the accelerometer. It takes an `accelConfig` object:

| Name        | Type    | Argument   | Default   | Description                                                                                                                                                                                                     |
| ----        | :----:  | :--------: | --------- | -------------                                                                                                                                                                                                   |
| `rate`      | number  | (optional) | 100       | The rate accelerometer data points are generated in hertz. Valid values are 10, 25, 50, and 100.                                                                                                                |
| `samples`   | number  | (optional) | 25        | The number of accelerometer data points to accumulate in a batch before calling the event handler. Valid values are 1 to 25 inclusive.                                                                          |
| `subscribe` | boolean | (optional) | automatic | Whether to subscribe to accelerometer data events. Accel.accelPeek cannot be used when subscribed. Pebble.js will automatically (un)subscribe for you depending on the amount of accelData handlers registered. |

The number of callbacks will depend on the configuration of the accelerometer. With the default rate of 100Hz and 25 samples, your callback will be called every 250ms with 25 samples each time.

**Important:** If you configure the accelerometer to send data many events, you will overload the bluetooth connection. We recommend that you send at most 5 events per second.

#### Accel.peek(callback)

Peeks at the current accelerometer value. The callback function will be called with the data point as an event.

````js
Accel.peek(function(data)) {
  console.log('Current acceleration on axis are: X=' + data.x + ' Y=' + data.y + ' Z=' + data.z);
});
````

#### Accel.on('tap', callback)

Subscribe to the `tap` event. The callback function will be passed an event with the following fields:

 * `axis`: The axis the tap event occurred on: 'x', 'y', or 'z'.
 * `direction`: The direction of the tap along the axis: 1 or -1.

````js
Accel.on('tap', function (e) {
  console.log('Tap event on axis: ' + e.axis + ' and direction: ' + e.direction);
});
````

#### Accel.on('accelData', callback)

Subscribe to the 'accelData' event. The callback function will be passed an event with the following fields:

 * `samples`: The number of accelerometer samples in this event.
 * `accel`: The first data point in the batch. This is provided for convenience.
 * `accels`: The accelerometer samples in an array.

One accelerometer data point is an object with the following properties:

| Property | Type    | Description                                                                                                                                                               |
| -------- | : ---:  | ------------                                                                                                                                                              |
| `x`      | Number  | The acceleration across the x-axis (from left to right when facing your Pebble)                                                                                           |
| `y`      | Number  | The acceleration across the y-axis (from the bottom of the screen to the top of the screen)                                                                               |
| `z`      | Number  | The acceleration across the z-axis (going through your Pebble from the back side of your Pebble to the front side - and then through your head if Pebble is facing you ;) |
| `vibe`   | boolean | A boolean indicating whether Pebble was vibrating when this sample was measured.                                                                                          |
| `time`   | Number  | The amount of ticks in millisecond resolution when this point was measured.                                                                                               |

````js
Accel.on('accelData', function(e) {
  console.log('Just received ' + e.samples + ' from the accelerometer.');
});
````

### Window

`Window` is the basic building block in your Pebble.js application. All windows share some common properties and methods.

Pebble.js provides three types of Windows:

 * [Card]: Displays a title, a subtitle, a banner image and text on a screen. The position of the elements are fixed and cannot be changed.
 * [Menu]: Displays a menu on the Pebble screen. This is similar to the standard system menu in Pebble.
 * [Stage]: This is the most flexible Window. It allows you to add different [Element]s ([Circle], [Image], [Rect], [Text]) and to specify a position and size for each of them. You can also animate them.

| Name           | Type      | Default   | Description                                                                                     |
| ----           | :-------: | --------- | -------------                                                                                   |
| `clear`        | boolean   |           |                                                                                                 |
| `action`       | boolean   | false     | When true, an action bar will be shown on the right side of the screen.                         |
| `actionUp`     | Image     | None      | An image to display in the action bar, next to the up button.                                   |
| `actionSelect` | Image     | None      | An image to display in the action bar, next to the select button.                               |
| `actionDown`   | Image     | None      | An image to display in the action bar, next to the down button.                                 |
| `fullscreen`   | boolean   | false     | When true, the Pebble status bar will not be visible and the window will use the entire screen. |
| `scrollable`   | boolean   | false     | When true, the up and down button will scroll the content of this Card.                         |

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

#### Window.action()

Accessor to the `action` property. See [Window].

#### Window.actionUp()

Accessor to the `actionUp` property. See [Window].

#### Window.actionSelect()

Accessor to the `actionSelect` property. See [Window].

#### Window.actionDown()

Accessor to the `actionDown` property. See [Window].

#### Window.fullscreen(fullscreen)

Accessor to the `fullscreen` property. See [Window].

### Card

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
| `title`      | string    | ""        | Text to display in the title field at the top of the screen                                                                                                          |
| `subtitle`   | string    | ""        | Text to display below the title                                                                                                                                      |
| `body`       | string    | ""        | Text to display in the body field.                                                                                                                                   |
| `icon`       | Image     | null      | An image to display before the title text. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `subicon`    | Image     | null      | An image to display before the subtitle text. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `banner`     | Image     | null      | An image to display in the center of the screen. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `scrollable` | boolean   | false     | Whether the user can scroll this card with the up and down button. When this is enabled, click events on the up and down button will not be transmitted to your app. |
| `style`      | string    | "small"   | Selects the font used to display the body. This can be 'small', 'large' or 'mono'                                                                                    |

The small and large styles correspond to the system notification styles. Mono sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.

Note that all fields will automatically span multiple lines if needed and that you can '\n' to insert line breaks.

### Menu

A menu is a type of [Window] that displays a standard Pebble menu on the screen of Pebble.

Just like any window, you can initialize a Menu by passing an object to the constructor or by calling accessors to change the properties.

The properties available on a [Menu] are:

| Name         | Type    | Default | Description |
| ----         |:-------:|---------|-------------|
| `sections`   | Array   | `[]`        | A list of all the sections to display.            |

A menu contains one or more sections. Each section has a title and contains zero or more items. An item must have a title. It can also have a subtitle and an icon.

````js
var menu = new UI.Menu({
  sections: [{
    title: 'First section'
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

Define the section to be displayed at sectionIndex.

````js
var section = {
  title: 'Another section',
  items: [{
    title: 'With one item'
  }]
};
menu.section(1, section);
````

#### Menu.items(sectionIndex, items)

Define the items to display in a specific section.

````js
menu.items(0, [ { title: 'new item1' }, { title: 'new item2' } ]);
````

#### Menu.item(sectionIndex, itemIndex, item)

Define the item to display at index itemIndex in section sectionIndex.

````js
menu.item(0, 0, { title: 'A new item', subtitle: 'replacing the previous one' });
````

#### Menu.on('select', callback)

Registers a callback called when an item in the menu is selected.

**Note:** You can also register a callback for 'longSelect' event, triggered when the user long clicks on an item.

#### Menu.on('longSelect', callback)

See `Menu.on('select, callback)`

### Stage

A stage is a type of [Window] that displays a completely customizable user interface on the screen. When you initialize it, a [Stage] is empty and you will need to create instances of [Element] and add them to the stage.

Just like any window, you can initialize a Stage by passing an object to the constructor or by calling accessors to change the properties.

The properties available on a [Stage] are:

| Name         | Type    | Default | Description |
| ----         |:-------:|---------|-------------|
| `scrollable` | boolean | false   | Whether the user can scroll this card with the up and down button. When this is enabled, click events on the up and down button will not be transmitted to your app. |

#### Stage.add(element)

Adds an element to to this stage. This element will be immediately visible.

#### Stage.insert(index, element)

Inserts an element at a specific index in the list of Element.

#### Stage.remove(element)

Removes an element from the [Stage].

#### Stage.index(element)

Returns the index of an element in the Stage or -1 if the element is not in the Stage.

#### Stage.each(callback)

Iterates over all the elements on the stage.

````js
stage.each(function(element) {
  console.log('Element: ' + JSON.stringify(element));
});
````

### Element

There are four types of [Element] that can be instantiated at the moment: [Circle], [Image], [Rectangle] and [Text].

They all share some common properties:

| Name              | Type      | Default   | Description                                                        |
| ------------      | :-------: | --------- | -------------                                                      |
| `position`        | Vector2   |           | Position of this element in the stage.                             |
| `size`            | Vector2   |           | Size of this element in this stage.                                |
| `borderColor`     | string    | ''        | Color of the border of this element ('clear', 'black',or 'white'). |
| `backgroundColor` | string    | ''        | Background color of this element ('clear', 'black' or 'white').    |

All properties can be initialized by passing an object when creating the Element, and changed with accessors functions who have the name of the properties. Calling an accessor without a parameter will return the current value.

````js
var Vector2 = require('vector2');
var element = new Text({ position: new Vector2(0, 0), size: new Vector2(144, 168) });
element.borderColor('white');
console.log('This element background color is: ' + element.backgroundColor());
````

#### Element.index()

Returns the index of this element in its stage or -1 if this element is not part of a stage.

#### Element.remove()

Removes this element from its stage.

#### Element.animate(field, value, duration)

#### Element.position(position)

Accessor to the `position` property. See [Element].

#### Element.size(size)

Accessor to the `size` property. See [Element].

#### Element.borderColor(color)

Accessor to the `borderColor` property. See [Element].

#### Element.backgroundColor(color)

Accessor to the `backgroundColor` property. See [Element].

### Circle

An [Element] that displays a circle on the screen.

Default properties value:

 * `backgroundColor`: 'white'
 * `borderColor:`: 'clear'

### Rect

An [Element] that displays a rectangle on the screen.

The [Rect] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                        |
| ------------      | :-------: | --------- | -------------                                                      |
| `backgroundColor` | string    | "white"   | Background color of this element ('clear', 'black' or 'white').    |
| `borderColor`     | string    | "clear"   | Color of the border of this element ('clear', 'black',or 'white'). |

### Text

An [Element] that displays text on the screen.

The [Text] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------      | :-------: | --------- | -------------                                                                                                                                                                                                                                                                                                                                              |
| `text`            | string    | ""        | The text to display in this element.                                                                                                                                                                                                                                                                                                                       |
| `font`            | string    |           | The font to use for that text element. See [Using Fonts] for more information on the different fonts available and how to add your own fonts.                                                                                                                                                                                                              |
| `color`           |           | 'white'   | Color of the text ('white', 'black' or 'clear').                                                                                                                                                                                                                                                                                                           |
| `textOverflow`    | 'string'  |           | How to handle text overflow in this text element ('wrap', 'ellipsis' or 'fill').                                                                                                                                                                                                                                                                           |
| `textAlign`       | 'string'  |           | How to align text in this element ('left', 'center' or 'right').                                                                                                                                                                                                                                                                                           |
| `updateTimeUnits` | string    | ''        | Specifies the smallest time unit change that will cause this text to be redrawn ('seconds', 'minutes', 'hours', 'days', 'months', 'years'). Use this in conjunction with a time format string in the `text` property. This Text element will be redrawn every `updateTimeUnits` and the text parsed. The text formatting string format is described below. |
| `borderColor`     | string    | 'clear'   | Color of the border of this element ('clear', 'black',or 'white').                                                                                                                                                                                                                                                                                         |
| `backgroundColor` | string    | 'clear'   | Background color of this element ('clear', 'black' or 'white').                                                                                                                                                                                                                                                                                            |

#### Displaying time in a Text element

If you want to display the current time or date in a Text element, you can use a time formatting string in the `text` property. The text element will be redrawn every `updateTimeUnits` and the format time will be re-interpreted.

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

Sets the textOverflow property. See [Text].

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

### Vibe

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

## Libraries

Pebble.js includes several libraries to help you write applications.

### ajax

This module gives you a very simple and easy way to make HTTP requests.

````
var ajax = require('ajax');

ajax(
  {
    url: 'api.theysaidso.com/qod.json',
    type: 'json'
  },
  function (data) {
    console.log("Quote of the day is: " + data.contents.quote);
  },
  function (error) {
    console.log("Something bad happened :(" + error);
  }
);
````

#### ajax(options, success, failure)

The supported options are:

| Name      | Type    | Argument   | Default   | Description                                                                                                                                                                   |
| ----      | :----:  | :--------: | --------- | -------------                                                                                                                                                                 |
| `url`     | string  |            |           | The URL to make the ajax request to. e.g. 'http://www.example.com?name=value'                                                                                                 |
| `method`  | string  | (optional) | get       | The HTTP method to use: 'get', 'post', 'put', 'delete', 'options', or any other standard method supported by the running environment.                                         |
| `type`    | string  | (optional) |           | The expected response format. Specify `json` to have ajax parse the response as json and pass an object as the data parameter.
| `data`    | object  | (optional) |           | The request body, mainly to be used in combination with 'post' or 'put'. e.g. `{ username: 'guest' }`
| `headers` | object  | (optional) |           | Custom HTTP headers. Specify additional headers. e.g. `{ 'x-extra': 'Extra Header' }`
| `async`   | boolean | (optional) | true      | Whether the request will be asynchronous. Specify `false` for a blocking, synchronous request.
| `cache`   | boolean | (optional) | true      | Whether the result may be cached. Specify `false` to use the internal cache buster which appends the URL with the query parameter `_set` to the current time in milliseconds. |

The `success` callback will be called if the HTTP request is successful (When the status code is 200). The only parameter is the data received from the server. If the option `type: 'json'` was set, the response will automatically be converted to an object; otherwise `data` is a string.

The `failure` callback is called when an error occurred. The only parameter is a description of the error.

### Vector2

A 2 dimensional vector. The constructor takes two parameter for the x and y properties.

````js
var Vector2 = require('vector2');

var vec = new Vector2(144, 168);
````

For more information, please refer to the Vector2 class documentation in the three.js library.


[API Reference]: #api-reference
[Using Images]: #using-images
[Using Fonts]: #using-fonts

[Window]: #window
[Card]: #card
[Menu]: #menu
[Stage]: #stage
[Element]: #element
[Circle]: #circle
[Image]: #image
[Rect]: #rect
[Text]: #text
[Window.show()]: #window-show
[Window.hide()]: #window-hide
[Menu.on('select, callback)]: #menu-on-select-callback
