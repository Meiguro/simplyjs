var util2 = require('lib/util2');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var imageProps = [
  'image',
  'compositing',
];

var ImageElement = function(elementDef) {
  StageElement.call(this, elementDef);
  this.state.type = 4;
};

util2.inherit(ImageElement, StageElement);

Propable.makeAccessors(imageProps, ImageElement.prototype);

module.exports = ImageElement;
