var util2 = require('util2');
var myutil = require('myutil');
var StageElement = require('ui/element');

var defaults = {
  backgroundColor: 'white',
  borderColor: 'clear',
};

var CircleArc = function(elementDef) {
  StageElement.call(this, myutil.shadow(defaults, elementDef || {}));
  this.state.type = StageElement.CircleArcType;
};

util2.inherit(CircleArc, StageElement);

module.exports = CircleArc;
