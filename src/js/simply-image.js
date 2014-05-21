/* global simply, util2, PNG */

var SimplyImage = (function() {

var SimplyImage = {};

var getPos = function(width, x, y) {
  return y * width * 4 + x * 4;
};

var getPixelGrey = function(pixels, pos) {
  return ((pixels[pos] + pixels[pos + 1] + pixels[pos + 2]) / 3) & 0xFF;
};

SimplyImage.greyscale = function(pixels, width, height) {
  for (var y = 0, yy = height; y < yy; ++y) {
    for (var x = 0, xx = width; x < xx; ++x) {
      var pos = getPos(width, x, y);
      var newColor = getPixelGrey(pixels, pos);
      for (var i = 0; i < 3; ++i) {
        pixels[pos + i] = newColor;
      }
    }
  }
};

SimplyImage.dither = function(pixels, width, height) {
  for (var y = 0, yy = height; y < yy; ++y) {
    for (var x = 0, xx = width; x < xx; ++x) {
      var pos = getPos(width, x, y);
      var oldColor = pixels[pos];
      var newColor = oldColor >= 128 ? 255 : 0;
      var error = oldColor - newColor;
      pixels[pos] = newColor;
      if (x + 1 < width) {
        pixels[getPos(width, x+1, y  )] += parseInt(error * 7/16);
      }
      if (x - 1 >= 0 && y + 1 < height) {
        pixels[getPos(width, x-1, y+1)] += parseInt(error * 3/16);
      }
      if (y + 1 < height) {
        pixels[getPos(width, x  , y+1)] += parseInt(error * 5/16);
      }
      if (x + 1 < width && y + 1 < height) {
        pixels[getPos(width, x+1, y+1)] += parseInt(error * 1/16);
      }
      for (var i = 1; i < 3; ++i) {
        pixels[pos + i] = newColor;
      }
    }
  }
};

SimplyImage.resizeNearest = function(pixels, width, height, newWidth, newHeight) {
  var newPixels = new Array(newWidth * newHeight * 4);
  var widthRatio = width / newWidth;
  var heightRatio = height / newHeight;
  for (var y = 0, yy = newHeight; y < yy; ++y) {
    for (var x = 0, xx = newWidth; x < xx; ++x) {
      var x2 = parseInt(x * widthRatio);
      var y2 = parseInt(y * heightRatio);
      var pos2 = getPos(width, x2, y2);
      var pos = getPos(newWidth, x, y);
      for (var i = 0; i < 4; ++i) {
        newPixels[pos + i] = pixels[pos2 + i];
      }
    }
  }
  return newPixels;
};

SimplyImage.resizeSample = function(pixels, width, height, newWidth, newHeight) {
  var newPixels = new Array(newWidth * newHeight * 4);
  var widthRatio = width / newWidth;
  var heightRatio = height / newHeight;
  for (var y = 0, yy = newHeight; y < yy; ++y) {
    for (var x = 0, xx = newWidth; x < xx; ++x) {
      var x2 = Math.min(parseInt(x * widthRatio), width - 1);
      var y2 = Math.min(parseInt(y * heightRatio), height - 1);
      var pos = getPos(newWidth, x, y);
      for (var i = 0; i < 4; ++i) {
        newPixels[pos + i] = ((pixels[getPos(width, x2  , y2  ) + i] +
                               pixels[getPos(width, x2+1, y2  ) + i] +
                               pixels[getPos(width, x2  , y2+1) + i] +
                               pixels[getPos(width, x2+1, y2+1) + i]) / 4) & 0xFF;
      }
    }
  }
  return newPixels;
};

SimplyImage.resize = function(pixels, width, height, newWidth, newHeight) {
  if (newWidth < width || newHeight < height) {
    return SimplyImage.resizeSample.apply(this, arguments);
  } else {
    return SimplyImage.resizeNearest.apply(this, arguments);
  }
};

SimplyImage.toGbitmap = function(pixels, width, height) {
  var rowBytes = width * 4;

  var gpixels = [];
  var growBytes = Math.ceil(width / 32) * 4;
  for (var i = 0, ii = height * growBytes; i < ii; ++i) {
    gpixels[i] = 0;
  }

  for (var y = 0, yy = height; y < yy; ++y) {
    for (var x = 0, xx = width; x < xx; ++x) {
      var grey = 0;
      var pos = y * rowBytes + parseInt(x * 4);
      for (var j = 0; j < 3; ++j) {
        grey += pixels[pos + j];
      }
      grey /= 3 * 255;
      if (grey >= 0.5) {
        var gbytePos = y * growBytes + parseInt(x / 8);
        gpixels[gbytePos] += 1 << (x % 8);
      }
    }
  }

  var gbitmap = {
    width: width,
    height: height,
    pixels: gpixels,
  };

  return gbitmap;
};

SimplyImage.load = function(image, callback) {
  PNG.load(image.url, function(png) {
    var pixels = png.decode();
    var width = png.width;
    var height = png.height;
    SimplyImage.greyscale(pixels, width, height);
    if (image.width) {
      if (!image.height) {
        image.height = parseInt(height * (image.width / width));
      }
    } else if (image.height) {
      if (!image.width) {
        image.width = parseInt(width * (image.height / height));
      }
    } else {
      image.width = width;
      image.height = height;
    }
    if (image.width !== width || image.height !== height) {
      pixels = SimplyImage.resize(pixels, width, height, image.width, image.height);
      width = image.width;
      height = image.height;
    }
    if (image.dither) {
      SimplyImage.dither(pixels, width, height);
    }
    image.gbitmap = SimplyImage.toGbitmap(pixels, width, height);
    if (callback) {
      callback(image);
    }
  });
  return image;
};

return SimplyImage;

})();
