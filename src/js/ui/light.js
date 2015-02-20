var Light = module.exports;
var simply = require('ui/simply');

Light.on = function() {
  simply.impl.light('on');
};

Light.auto = function() {
  simply.impl.light('auto');
}

Light.trigger = function() {
  simply.impl.light('trigger');
}
