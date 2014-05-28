// Welcome to PebbleJS!
//
// This is where you write your app.

var wind = new Pebble.UI.Card({
  title: "PebbleJS",
  icon: "images/menu_icon.png",
  body: "Saying Hello World"
});
wind.show();

wind.on('singleClick', function(e) {
  console.log("Button pressed: " + JSON.stringify(e));
  if (e.button == 'up') {
    var menu = new Pebble.UI.Menu();
    menu.items(0, [ { title: 'Hello World!', subtitle: 'text' }, { title: 'item2' } ]);
    menu.show();
  }
  else if (e.button === 'select') {
    var stage = new Pebble.UI.Stage();
    stage.add(new Pebble.UI.Text({ text: 'Yo!', position: new Pebble.UI.Vector2(10, 10), size: new Pebble.UI.Vector2(100, 30) }));
    stage.show();
  }
  else /* 'down' */ {
    var card = new Pebble.UI.Card();
    card.title("A PebbleJS Card");
    card.subtitle("With subtitle");
    card.body("This is the simplest element you can push to the screen");
    card.show();
  }
});

