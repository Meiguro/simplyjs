var util2 = require('lib/util2');
var StageElement = require('ui/element');

var Rect = function(elementDef) {
  StageElement.call(this, elementDef);
  this.state.type = 1;
};

util2.inherit(Rect, StageElement);

module.exports = Rect;
