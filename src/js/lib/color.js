var Color = {};

Color.normalizeString = function(color) {
  if (typeof color === 'string') {
    if (color.substr(0, 2) === '0x') {
      return color.substr(2);
    } else if (color[0] === '#') {
      return color.substr(1);
    }
  }
  return color;
};

Color.rgbUint12To24 = function(color) {
  return ((color & 0xf00) << 12) | ((color & 0xf0) << 8) | ((color & 0xf) << 4);
};

Color.toArgbUint32 = function(color) {
  var argb = color;
  if (typeof color !== 'number') {
    color = Color.normalizeString(color.toString());
    argb = parseInt(color, 16);
  }
  if (typeof color === 'string') {
    var alpha = 0xff000000;
    if (color.length === 3) {
      argb = alpha | Color.rgbUint12To14(argb);
    } else if (color.length === 6) {
      argb = alpha | argb;
    }
  }
  return argb;
};

Color.toRgbUint24 = function(color) {
  return Color.toArgbUint32(color) & 0xffffff;
};

Color.toArgbUint8 = function(color) {
  var argb = Color.toArgbUint32(color);
  return (((argb >> 24) & 0xc0) | ((argb >> 18) & 0x30) |
          ((argb >> 12) & 0xc) | ((argb >> 6) & 0x3));
};

Color.toRgbUint8 = function(color) {
  return Color.toArgbUint8(color) & 0x3f;
};

module.exports = Color;
