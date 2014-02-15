/*
 * util2.js by Meiguro - MIT License
 */

var util2 = (function(util2){

util2.noop = function() {};

util2.copy = function (a, b) {
  b = b || (a instanceof Array ? [] : {});
  for (var k in a) { b[k] = a[k]; }
  return b;
};

util2.toInteger = function (x) {
  if (!isNaN(x = parseInt(x))) { return x; }
};

util2.toNumber = function (x) {
  if (!isNaN(x = parseFloat(x))) { return x; }
};

util2.toArray = function (x) {
  if (x instanceof Array) { return x; }
  return [x];
};

util2.trim = function (s) {
  return s ? s.toString().trim() : s;
};

var chunkSize = 128;

var randomBytes = function(chunkSize) {
  var z = [];
  for (var i = 0; i < chunkSize; ++i) {
    z[i] = String.fromCharCode(Math.random() * 256);
  }
  return z.join('');
};

util2.randomString = function (regex, size, acc) {
  if (!size) {
    return '';
  }
  if (typeof regex === 'string') {
    regex = new RegExp('(?!'+regex+')[\\s\\S]', 'g');
  }
  acc = acc || '';
  var buf = randomBytes(chunkSize);
  if (buf) {
    acc += buf.replace(regex, '');
  }
  if (acc.length >= size) {
    return acc.substr(0, size);
  } else {
    return util2.randomString(regex, size, acc);
  }
};

var varpat = new RegExp("^([\\s\\S]*?)\\$([_a-zA-Z0-9]+)", "m");

util2.format = function (text, table) {
  var m, z = '';
  while ((m = text.match(varpat))) {
    var subtext = m[0], value = table[m[2]];
    if (typeof value === 'function') { value = value(); }
    z += value !== undefined ? m[1] + value.toString() : subtext;
    text = text.substring(subtext.length);
  }
  z += text;
  return z;
};

return util2;

})(typeof util2 !== 'undefined' ? util2 : {});
