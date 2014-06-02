var util2 = require('util2');
var Text = require('ui/text');

var TimeText = function(elementDef) {
  Text.call(this, elementDef);
  if (this.state.text) {
    this.text(this.state.text);
  }
};

util2.inherit(TimeText, Text);

var formatUnits = {
  a: 'days',
  A: 'days',
  b: 'months',
  B: 'months',
  c: 'seconds',
  d: 'days',
  H: 'hours',
  I: 'hours',
  j: 'days',
  m: 'months',
  M: 'minutes',
  p: 'hours',
  S: 'seconds',
  U: 'days',
  w: 'days',
  W: 'days',
  x: 'days',
  X: 'seconds',
  y: 'years',
  Y: 'years',
};

var getUnitsFromText = function(text) {
  var units = {};
  text.replace(/%(.)/g, function(_, code) {
    var unit = formatUnits[code];
    if (unit) {
      units[unit] = true;
    }
    return _;
  });
  return units;
};

TimeText.prototype.text = function(text) {
  if (arguments.length === 0) {
    return this.state.text;
  }
  this.prop({
    text: text,
    updateTimeUnits: getUnitsFromText(text),
  });
  return this;
};

module.exports = TimeText;
