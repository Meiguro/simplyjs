var Vibe = module.exports;
var simply = require('ui/simply');

Vibe.vibrate = function(type) {
  simply.impl.vibe(type);
};

