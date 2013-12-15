(function() {

Pebble.addEventListener('ready', function(e) {
  simply.on('singleClick', function(e) {
    console.log(util2.format('single clicked $0!', [e.button]));
    simply.setText({
      subtitle: 'Pressed ' + e.button + '!',
    });
  });
  simply.on('longClick', function(e) {
    console.log(util2.format('long clicked $0!', [e.button]));
  });
  simply.begin();
});

})();
