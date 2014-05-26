var util2 = require('lib/util2');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var textProps = [
  'text',
  'font',
  'color',
  'textOverflow',
  'textAlign',
  'time',
  'timeUnits',
];

var Text = function(elementDef) {
  StageElement.call(this, elementDef);
  this.state.type = 3;
};

util2.inherit(Text, StageElement);

Propable.makeAccessors(textProps, Text.prototype);

module.exports = Text;
