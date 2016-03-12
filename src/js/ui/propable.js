var util2 = require('util2');
var myutil = require('myutil');

var Propable = function(def) {
  this.state = def || {};
};

Propable.unset = function(k) {
  delete this[k];
};

Propable.makeAccessor = function(k) {
  return function(value) {
    if (arguments.length === 0) {
      return this.state[k];
    }
    this.state[k] = value;
    this._prop(myutil.toObject(k, value));
    return this;
  };
};

Propable.makeNestedAccessor = function(k) {
  var _k = '_' + k;
  return function(field, value, clear) {
    var nest = this.state[k];
    if (arguments.length === 0) {
      return nest;
    }
    if (arguments.length === 1 && typeof field === 'string') {
      return typeof nest === 'object' ? nest[field] : undefined;
    }
    if (typeof field === 'boolean') {
      value = field;
      field = k;
    }
    if (typeof field === 'object') {
      clear = value;
      value = undefined;
    }
    if (clear) {
      this._clear(k);
    }
    if (field !== undefined && typeof nest !== 'object') {
      nest = this.state[k] = {};
    }
    if (field !== undefined && typeof nest === 'object') {
      util2.copy(myutil.toObject(field, value), nest);
    }
    if (this[_k]) {
      this[_k](nest);
    }
    return this;
  };
};

Propable.makeAccessors = function(props, proto) {
  proto = proto || {};
  props.forEach(function(k) {
    proto[k] = Propable.makeAccessor(k);
  });
  return proto;
};

Propable.makeNestedAccessors = function(props, proto) {
  proto = proto || {};
  props.forEach(function(k) {
    proto[k] = Propable.makeNestedAccessor(k);
  });
  return proto;
};

Propable.prototype.unset = function(k) {
  delete this.state[k];
};

Propable.prototype._clear = function(k) {
  if (k === undefined || k === true) {
    this.state = {};
  } else if (k !== false) {
    this.state[k] = {};
  }
};

Propable.prototype._prop = function(def) {
};

Propable.prototype.prop = function(field, value, clear) {
  if (arguments.length === 0) {
    return util2.copy(this.state);
  }
  if (arguments.length === 1 && typeof field !== 'object') {
    return this.state[field];
  }
  if (typeof field === 'object') {
    clear = value;
  }
  if (clear) {
    this._clear(true);
  }
  var def = myutil.toObject(field, value);
  util2.copy(def, this.state);
  this._prop(def);
  return this;
};

module.exports = Propable;
