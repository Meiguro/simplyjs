var util2 = require('lib/util2');
var myutil = require('lib/myutil');
var StageElement = require('ui/element');

var Inverter = function(elementDef) {
  StageElement.call(this, elementDef);
  this.state.type = 5;
};

util2.inherit(Inverter, StageElement);

module.exports = Inverter;
