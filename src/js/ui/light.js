var simply = require('ui/simply');

var Light = module.exports;

Light.on = function() {
  simply.impl.light('on');
};

Light.auto = function() {
  simply.impl.light('auto');
};

Light.trigger = function() {
  simply.impl.light('trigger');
};
