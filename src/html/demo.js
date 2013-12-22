console.log('Simply.js demo!');

simply.on('singleClick', function(e) {
  console.log(util2.format('single clicked $button!', e));
  simply.subtitle('Pressed ' + e.button + '!');
});

simply.on('longClick', function(e) {
  console.log(util2.format('long clicked $button!', e));
  simply.vibe();
  simply.scrollable(e.button !== 'select');
});

simply.on('accelTap', function(e) {
  console.log(util2.format('tapped accel axis $axis $direction!', e));
  simply.subtitle('Tapped ' + (e.direction > 0 ? '+' : '-') + e.axis + '!');
});

simply.setText({
  title: 'Simply Demo!',
  body: 'This is a demo. Press buttons or tap the watch!',
}, true);
