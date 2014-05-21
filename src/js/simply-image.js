/* global simply, util2, PNG */

var SimplyImage = (function() {

var SimplyImage = {};

SimplyImage.toGbitmap = function(png) {
  var pixels = png.decode();
  var byteDepth = 4;
  var rowBytes = png.width * byteDepth;

  var gpixels = [];
  var growBytes = Math.ceil(png.width / 32) * 4;
  for (var i = 0, ii = png.height * growBytes; i < ii; ++i) {
    gpixels[i] = 0;
  }

  for (var y = 0, yy = png.height; y < yy; ++y) {
    for (var x = 0, xx = png.width; x < xx; ++x) {
      var grey = 0;
      var pos = y * rowBytes + parseInt(x * byteDepth);
      var numColors = byteDepth - (png.hasAlphaChannel ? 1 : 0);
      for (var j = 0; j < numColors; ++j) {
        grey += pixels[pos + j];
      }
      grey /= numColors * 255;
      if (grey >= 0.5) {
        var gbytePos = y * growBytes + parseInt(x / 8);
        gpixels[gbytePos] += 1 << (x % 8);
      }
    }
  }

  var gbitmap = {
    width: png.width,
    height: png.height,
    pixels: gpixels,
  };

  return gbitmap;
};

SimplyImage.load = function(image, callback) {
  PNG.load(image.path, function(png) {
    image.gbitmap = SimplyImage.toGbitmap(png);
    if (callback) {
      callback(image);
    }
  });
  return image;
};

return SimplyImage;

})();
