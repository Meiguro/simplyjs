/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

var wind = new UI.Card({
  title: 'Pebble.js',
  icon: 'images/menu_icon.png',
  body: 'Saying Hello World'
});

wind.show();

wind.on('click', 'up', function(e) {
  var menu = new UI.Menu();
  menu.items(0, [{
    title: 'Hello World!', subtitle: 'Subtitle text'
  }, {
    title: 'Item #2'
  }]);
  menu.show();
});

wind.on('click', 'select', function(e) {
  var stage = new UI.Stage();
  var textfield = new UI.Text({
    text: 'Yo!',
    position: new Vector2(10, 10),
    size: new Vector2(100, 30),
  });
  stage.add(textfield);
  stage.show();
});

wind.on('click', 'down', function(e) {
  var card = new UI.Card();
  card.title('A Pebble.js Card');
  card.subtitle('With subtitle');
  card.body('This is the simplest window you can push to the screen.');
  card.show();
});
