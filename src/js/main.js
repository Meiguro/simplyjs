(function() {

var settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

Pebble.addEventListener('ready', function(e) {
  simply.init();
});

Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL(settingsUrl);
});

})();
