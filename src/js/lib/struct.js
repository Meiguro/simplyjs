/**
 * struct.js - chainable ArrayBuffer DataView wrapper
 *
 * @author Meiguro / http://meiguro.com/
 * @license MIT
 */

var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

var struct = function(def) {
  this._littleEndian = true;
  this._offset = 0;
  this._makeAccessors(def);
  this._view = new DataView(new ArrayBuffer(this.size));
  this._def = def;
};

struct.types = {
  int8: { size: 1 },
  uint8: { size: 1 },
  int16: { size: 2 },
  uint16: { size: 2 },
  int32: { size: 4 },
  uint32: { size: 4 },
  int64: { size: 8 },
  uint64: { size: 8 },
  float32: { size: 2 },
  float64: { size: 4 },
};

struct.prototype._makeAccessor = function(index, type, name, transform) {
  var getName = 'get' + capitalize(type);
  var setName = 'set' + capitalize(type);
  this[name] = function(value) {
    if (arguments.length === 0) {
      return this._view[getName](this._offset + index, this._littleEndian);
    }
    if (transform) {
      value = transform(value);
    }
    this._view[setName](this._offset + index, value, this._littleEndian);
    return this;
  };
  return this;
};

struct.prototype._makeAccessors = function(def, index, fields, prefix) {
  index = index || 0;
  fields = fields || [];
  for (var i = 0, ii = def.length; i < ii; ++i) {
    var member = def[i];
    var type = member[0];
    var name = member[1];
    if (prefix) {
      name = prefix + capitalize(name);
    }
    if (type instanceof struct) {
      this._makeAccessors(type._def, index, fields, name);
      index = this.size;
      continue;
    }
    var transform = member[2];
    this._makeAccessor(index, type, name, transform);
    fields.push({
      type: type,
      name: name,
      transform: transform,
    });
    index += struct.types[type].size;
  }
  this.fields = fields;
  this.size = index;
  return this;
};

struct.prototype.prop = function(def) {
  if (arguments.length === 0) {
    var obj = {};
    var fields = this.fields;
    for (var i = 0, ii = fields.length; i < ii; ++i) {
      var name = fields[i].name;
      obj[name] = this[name]();
    }
    return obj;
  }
  for (var k in def) {
    this[k](def[k]);
  }
  return this;
};

struct.prototype.view = function(view) {
  if (arguments.length === 0) {
    return this._view;
  }
  if (view instanceof ArrayBuffer) {
    view = new DataView(view);
  }
  this._view = view;
  return this;
};

struct.prototype.offset = function(offset) {
  if (arguments.length === 0) {
    return this._offset;
  }
  this._offset = offset;
  return this;
};

module.exports = struct;

