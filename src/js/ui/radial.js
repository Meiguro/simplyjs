var util2 = require('util2');
var myutil = require('myutil');
var safe = require('safe');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var accessorProps = [
  'radius',
  'angle',
  'angle2',
];

var defaults = {
  backgroundColor: 'white',
  borderColor: 'clear',
  borderWidth: 1,
  radius: 0,
  angle: 0,
  angle2: 360,
};

var checkProps = function(def) {
  if (!def) return;
  if ('angleStart' in def && safe.warnAngleStart !== false) {
    safe.warn('`angleStart` has been deprecated in favor of `angle` in order to match\n\t' +
              "Line's `position` and `position2`. Please use `angle` intead.", 2);
    safe.warnAngleStart = false;
  }
  if ('angleEnd' in def && safe.warnAngleEnd !== false) {
    safe.warn('`angleEnd` has been deprecated in favor of `angle2` in order to match\n\t' +
              "Line's `position` and `position2`. Please use `angle2` intead.", 2);
    safe.warnAngleEnd = false;
  }
};

var Radial = function(elementDef) {
  checkProps(elementDef);
  StageElement.call(this, myutil.shadow(defaults, elementDef || {}));
  this.state.type = StageElement.RadialType;
};

util2.inherit(Radial, StageElement);

Propable.makeAccessors(accessorProps, Radial.prototype);

Radial.prototype._prop = function(def) {
  checkProps(def);
  StageElement.prototype._prop.call(this, def);
};

module.exports = Radial;
