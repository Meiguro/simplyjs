var util2 = require('util2');
var myutil = require('myutil');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var imageProps = [
  'image',
  'compositing',
];

var defaults = {
  backgroundColor: 'clear',
  borderColor: 'clear',
};

var ImageElement = function(elementDef) {
  StageElement.call(this, elementDef);
  myutil.shadow(defaults, this.state);
  this.state.type = 4;
};

util2.inherit(ImageElement, StageElement);

Propable.makeAccessors(imageProps, ImageElement.prototype);

module.exports = ImageElement;
