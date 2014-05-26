var util2 = require('lib/util2');
var StageElement = require('ui/element');

var Circle = function(elementDef) {
  StageElement.call(this, elementDef);
  this.state.type = 2;
};

util2.inherit(Circle, StageElement);

module.exports = Circle;
