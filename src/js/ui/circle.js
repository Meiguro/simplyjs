var util2 = require('util2');
var myutil = require('myutil');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var accessorProps = [
  'radius',
];

var defaults = {
  backgroundColor: 'white',
  borderColor: 'clear',
  borderWidth: 1,
};

var Circle = function(elementDef) {
  StageElement.call(this, myutil.shadow(defaults, elementDef || {}));
  this.state.type = StageElement.CircleType;
};

util2.inherit(Circle, StageElement);

Propable.makeAccessors(accessorProps, Circle.prototype);

module.exports = Circle;
