/* global simply */
console.log('Simply.js demo!');

simply.text({
  title: 'Simply Demo!',
  body: 'This is a demo. Press buttons or tap the watch!',
}, true);

simply.on('singleClick', function(e) {
  console.log('single clicked ' + e.button + '!');
  simply.subtitle('Pressed ' + e.button + '!');
});

simply.on('longClick', function(e) {
  console.log('long clicked ' + e.button + '!');
  simply.subtitle('Long pressed ' + e.button + '!');
  simply.vibe();
});

simply.on('accelTap', function(e) {
  console.log('accel tapped axis ' + e.axis + ' ' + e.direction + '!');
  simply.subtitle('Tapped ' + (e.direction > 0 ? '+' : '-') + e.axis + '!');
});
