/* global PNG */

var image = {};

var getPos = function(width, x, y) {
  return y * width * 4 + x * 4;
};

var getPixelGrey = function(pixels, pos) {
  return ((pixels[pos] + pixels[pos + 1] + pixels[pos + 2]) / 3) & 0xFF;
};

image.greyscale = function(pixels, width, height) {
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

image.dithers = {};

image.dithers['floyd-steinberg'] = [
  [ 1, 0, 7/16],
  [-1, 1, 3/16],
  [ 0, 1, 5/16],
  [ 1, 1, 1/16]];

image.dithers['jarvis-judice-ninke'] = [
  [ 1, 0, 7/48],
  [ 2, 0, 5/48],
  [-2, 1, 3/48],
  [-1, 1, 5/48],
  [ 0, 1, 7/48],
  [ 1, 1, 5/48],
  [ 2, 1, 3/48],
  [-2, 2, 1/48],
  [-1, 2, 3/48],
  [ 0, 2, 5/48],
  [ 1, 2, 3/48],
  [ 2, 2, 1/48]];

image.dithers.sierra = [
  [ 1, 0, 5/32],
  [ 2, 0, 3/32],
  [-2, 1, 2/32],
  [-1, 1, 4/32],
  [ 0, 1, 5/32],
  [ 1, 1, 4/32],
  [ 2, 1, 2/32],
  [-1, 2, 2/32],
  [ 0, 2, 3/32],
  [ 1, 2, 2/32]];

image.dithers['default'] = image.dithers.sierra;

image.dither = function(pixels, width, height, dithers) {
  dithers = dithers || image.dithers['default'];
  var numdithers = dithers.length;
  for (var y = 0, yy = height; y < yy; ++y) {
    for (var x = 0, xx = width; x < xx; ++x) {
      var pos = getPos(width, x, y);
      var oldColor = pixels[pos];
      var newColor = oldColor >= 128 ? 255 : 0;
      var error = oldColor - newColor;
      pixels[pos] = newColor;
      for (var i = 0; i < numdithers; ++i) {
        var dither = dithers[i];
        var x2 = x + dither[0], y2 = y + dither[1];
        if (x2 >= 0 && x2 < width && y < height) {
          pixels[getPos(width, x2, y2)] += parseInt(error * dither[2]);
        }
      }
      for (var j = 1; j < 3; ++j) {
        pixels[pos + j] = newColor;
      }
    }
  }
};

image.resizeNearest = function(pixels, width, height, newWidth, newHeight) {
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

image.resizeSample = function(pixels, width, height, newWidth, newHeight) {
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

image.resize = function(pixels, width, height, newWidth, newHeight) {
  if (newWidth < width || newHeight < height) {
    return image.resizeSample.apply(this, arguments);
  } else {
    return image.resizeNearest.apply(this, arguments);
  }
};

image.toGbitmap = function(pixels, width, height) {
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

image.load = function(img, callback) {
  PNG.load(img.url, function(png) {
    var pixels = png.decode();
    var width = png.width;
    var height = png.height;
    image.greyscale(pixels, width, height);
    if (img.width) {
      if (!img.height) {
        img.height = parseInt(height * (img.width / width));
      }
    } else if (img.height) {
      if (!img.width) {
        img.width = parseInt(width * (img.height / height));
      }
    } else {
      img.width = width;
      img.height = height;
    }
    if (img.width !== width || img.height !== height) {
      pixels = image.resize(pixels, width, height, img.width, img.height);
      width = img.width;
      height = img.height;
    }
    if (img.dither) {
      var dithers = image.dithers[img.dither];
      image.dither(pixels, width, height, dithers);
    }
    img.gbitmap = image.toGbitmap(pixels, width, height);
    if (callback) {
      callback(img);
    }
  });
  return img;
};

module.exports = image;
