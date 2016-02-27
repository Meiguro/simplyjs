var util2 = require('util2');
var myutil = require('myutil');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var accessorProps = [
  'strokeColor',
  'strokeWidth',
  'position2',
];

var defaults = {
  strokeColor: 'white',
  strokeWidth: 1,
};

var Line = function(elementDef) {
  StageElement.call(this, myutil.shadow(defaults, elementDef || {}));
  this.state.type = StageElement.LineType;
};

util2.inherit(Line, StageElement);

Propable.makeAccessors(accessorProps, Line.prototype);

module.exports = Line;
