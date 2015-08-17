/**
 * PNG Encoder from data-demo
 * https://code.google.com/p/data-demo/
 *
 * @author mccalluc@yahoo.com
 * @license MIT
 */

var Zlib = require('vendor/zlib');

var png = {};

png.Bytes = function(data, optional) {
  var datum, i;
  this.array = [];

  if (!optional) {

    if (data instanceof Array || data instanceof Uint8Array) {
      for (i = 0; i < data.length; i++) {
        datum = data[i];
        if (datum !== null) { // nulls and undefineds are silently skipped.
          if (typeof datum !== "number") {
            throw new Error("Expected number, not "+(typeof datum));
          } else if (Math.floor(datum) != datum) {
            throw new Error("Expected integer, not "+datum);
          } else if (datum < 0 || datum > 255) {
            throw new Error("Expected integer in [0,255], not "+datum);
          }
          this.array.push(datum);
        }
      }
    }

    else if (typeof data == "string") {
      for (i = 0; i < data.length; i++) {
        datum = data.charCodeAt(i);
        if (datum < 0 || datum > 255) {
          throw new Error("Characters above 255 not allowed without explicit encoding: "+datum);
        }
        this.array.push(datum);
      }
    }

    else if (data instanceof png.Bytes) {
      this.array.push.apply(this.array, data.array);
    }

    else if (typeof data == "number") {
        return new png.Bytes([data]);
    }

    else {
      throw new Error("Unexpected data type: "+data);
    }

  }

  else { // optional is defined.

    // TODO: generalize when generalization is required.
    if (typeof data == "number" &&
        Math.floor(data) == data &&
        data >= 0 &&
        (optional.bytes in {4:1, 2:1}) &&
        // don't change this last one to bit shifts: in JS, 0x100 << 24 == 0.
        data < Math.pow(256, optional.bytes)) {
      this.array = [
        (data & 0xFF000000) >>> 24,
        (data & 0x00FF0000) >>> 16,
        (data & 0x0000FF00) >>> 8,
        (data & 0x000000FF)
      ].slice(-optional.bytes);
    }

    else throw new Error("Unexpected data/optional args combination: "+data);

  }
};

png.Bytes.prototype.add = function(data, optional) {
  // Takes the same arguments as the constructor,
  // but appends the new data instead, and returns the modified object.
  // (suitable for chaining.)
  this.array.push.apply(this.array, new png.Bytes(data, optional).array);
  return this;
};

png.Bytes.prototype.chunk = function(n) {
  // Split the array into chunks of length n.
  // Returns an array of arrays.
  var buffer = [];
  for (var i = 0; i < this.array.length; i += n) {
    var slice = this.array.slice(i, i+n);
    buffer.push(this.array.slice(i, i+n));
  }
  return buffer;
};

png.Bytes.prototype.toString = function(n) {
  // one optional argument specifies line length in bytes.
  // returns a hex dump of the Bytes object.
  var chunks = this.chunk(n || 8);
  var byte;
  var lines = [];
  var hex;
  var chr;
  for (var i = 0; i < chunks.length; i++) {
    hex = [];
    chr = [];
    for (var j = 0; j < chunks[i].length; j++) {
      byte = chunks[i][j];
      hex.push(
        ((byte < 16) ? "0" : "") +
        byte.toString(16)
      );
      chr.push(
        (byte >=32 && byte <= 126 ) ?
          String.fromCharCode(byte)
          : "_"
      );
    }
    lines.push(hex.join(" ")+"  "+chr.join(""));
  }
  return lines.join("\n");
};

png.Bytes.prototype.serialize = function() {
  // returns a string whose char codes correspond to the bytes of the array.
  // TODO: get rid of this once transition is complete?
  return String.fromCharCode.apply(null, this.array);
};

png.fromRaster = function(raster, optional_palette, optional_transparency) {
  // Given a Raster object,
  // and optionally a list of rgb triples,
  // and optionally a corresponding list of transparency values (0: clear - 255: opaque)
  // return the corresponding PNG as a Bytes object.

  var signature = new png.Bytes([
    137, 80 /* P */, 78 /* N */, 71 /* G */, 13, 10, 26, 10
  ]);
  var ihdr = new png.Chunk.IHDR(raster.width, raster.height, raster.bit_depth, raster.color_type);
  var plte = (optional_palette instanceof Array) ?
    new png.Chunk.PLTE(optional_palette) :
    new png.Bytes([]);
  var trns = (optional_transparency instanceof Array) ?
    new png.Chunk.tRNS(optional_transparency) :
    new png.Bytes([]);
  var idat = new png.Chunk.IDAT(raster);
  var iend = new png.Chunk.IEND(); // intentionally blank

  // order matters.
  return signature.add(ihdr).add(plte).add(trns).add(idat).add(iend);
};

png.encode = function(raster, bit_depth, color_type, optional_palette, optional_transparency) {
  if (color_type === 0 || color_type === 3) {
    raster = new png.Raster(bit_depth, color_type, raster);
  } else if (color_type === 2 || color_type === 6) {
    raster = new png.Raster_rgb(bit_depth, color_type, raster);
  }
  return png.fromRaster(raster, optional_palette, optional_transparency);
};

png.Chunk = function(type, data) {
  // given a four character type, and Bytes,
  // calculates the length and the checksum, and creates
  // a Bytes object for that png chunk.

  if (!type.match(/^[A-Za-z]{4}$/)) {
    throw new Error("Creating PNG chunk: provided type should be four letters, not "+type);
  }

  if (!(data instanceof png.Bytes)) {
    throw new Error("Creating PNG "+type+" chunk: provided data is not Bytes: "+data);
  }

    // CRC calculations are a literal translation of the C code at
  // http://www.libpng.org/pub/png/spec/1.0/PNG-CRCAppendix.html
  if (!png.crc_table) {
    png.crc_table = []; // Table of CRCs of all 8-bit messages.
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        if (c & 1) {
          c = 0xedb88320 ^ (c >>> 1); // C ">>" is JS ">>>"
        } else {
          c = c >>> 1; // C ">>" is JS ">>>"
        }
      }
      png.crc_table[n] = c;
    }
  }

  function update_crc(crc, buffer) {
    // Update a running CRC with the buffer--the CRC
    // should be initialized to all 1's, and the transmitted value
    // is the 1's complement of the final running CRC
    var c = crc;
    var n;
    for (n = 0; n < buffer.length; n++) {
      c = png.crc_table[(c ^ buffer[n]) & 0xff] ^ (c >>> 8); // C ">>" is JS ">>>"
    }
    return c;
  }

  var type_and_data = new png.Bytes(type).add(data);
  var crc = (update_crc(0xffffffff, type_and_data.array) ^ 0xffffffff)>>>0;
  // >>>0 converts to unsigned, without changing the bits.

  var length_type_data_checksum =
    new png.Bytes(data.array.length,{bytes:4})
    .add(type_and_data)
    .add(crc,{bytes:4});

  return length_type_data_checksum;
};

png.Chunk.IHDR = function(width, height, bit_depth, color_type) {
  if (!(
        // grayscale
        (color_type === 0) && (bit_depth in {1:1, 2:1, 4:1, 8:1, 16:1}) ||
        // rgb
        (color_type === 2) && (bit_depth in {8:1, 16:1}) ||
        // palette
        (color_type === 3) && (bit_depth in {1:1, 2:1, 4:1, 8:1}) ||
        // grayscale + alpha
        (color_type === 4) && (bit_depth in {8:1, 16:1}) ||
        // rgb + alpha
        (color_type ===  6) && (bit_depth in {8:1, 16:1})
        // http://www.libpng.org/pub/png/spec/1.0/PNG-Chunks.html#C.IHDR
        )) {
    throw new Error("Invalid color type ("+color_type+") / bit depth ("+bit_depth+") combo");
  }
  return new png.Chunk(
    "IHDR",
    new png.Bytes(width,{bytes:4})
      .add(height,{bytes:4})
      .add([
        bit_depth,
        color_type,
        0, // compression method
        0, // filter method
        0  // interlace method
      ])
  );
};

png.Chunk.PLTE = function(rgb_list) {
  // given a list of RGB triples,
  // returns the corresponding PNG PLTE (palette) chunk.
  for (var i = 0, ii = rgb_list.length; i < ii; i++) {
    var triple = rgb_list[i];
    if (triple.length !== 3) {
      throw new Error("This is not a valid RGB triple: "+triple);
    }
  }
  return new png.Chunk(
    "PLTE",
    new png.Bytes(Array.prototype.concat.apply([], rgb_list))
  );
};

png.Chunk.tRNS = function(alpha_list) {
  // given a list of alpha values corresponding to the palette entries,
  // returns the corresponding PNG tRNS (transparency) chunk.
  return new png.Chunk(
    "tRNS",
    new png.Bytes(alpha_list)
  );
};

png.Raster = function(bit_depth, color_type, raster) {
  // takes an array of arrays of greyscale or palette values.
  // provides encode(), which returns bytes ready for a PNG IDAT chunk.

  // validate depth and type
  if (color_type !== 0 && color_type !== 3) throw new Error("Color type "+color_type+" is unsupported.");
  if (bit_depth > 8) throw new Error("Bit depths greater than 8 are unsupported.");

  this.bit_depth = bit_depth;
  this.color_type = color_type;

  // validate raster data.
  var max_value = (1 << bit_depth) - 1;
  var cols = raster[0].length;
  for (var row = 0; row < raster.length; row++) {
    if (raster[row].length != cols)
      throw new Error("Row "+row+" does not have the expected "+cols+" columns.");
    for (var col = 0; col < cols; col++) {
      if (!(raster[row][col] >= 0 && raster[row][col] <= max_value))
        throw new Error("Image data ("+raster[row][col]+") out of bounds at ("+row+","+col+")");
    }
  }

  this.height = raster.length;
  this.width = cols;

  this.encode = function() {
    // Returns the image data as a single array of bytes, using filter method 0.
    var buffer = [];
    for (var row = 0; row < raster.length; row++) {
      buffer.push(0); // each row gets filter type 0.
      for (var col = 0; col < cols; col += 8/bit_depth) {
        var byte = 0;
        for (var sub = 0; sub < 8/bit_depth; sub++) {
          byte <<= bit_depth;
          if (col + sub < cols) {
            byte |= raster[row][col+sub];
          }
        }
        if (byte & ~0xFF) throw new Error("Encoded raster byte out of bounds at ("+row+","+col+")");
        buffer.push(byte);
      }
    }
    return buffer;
  };
};

png.Raster_rgb = function(bit_depth, color_type, raster) {
  // takes an array of arrays of RGB triples.
  // provides encode(), which returns bytes ready for a PNG IDAT chunk.

  // validate depth and type
  if (color_type != 2 && color_type != 6) throw new Error("Only color types 2 and 6 for RGB.");
  if (bit_depth != 8) throw new Error("Bit depths other than 8 are unsupported for RGB.");

  this.bit_depth = bit_depth;
  this.color_type = color_type;

  // validate raster data.
  var cols = raster[0].length;
  for (var row = 0; row < raster.length; row++) {
    if (raster[row].length != cols) {
      throw new Error("Row "+row+" does not have the expected "+cols+" columns.");
    }
    for (var col = 0; col < cols; col++) {
      if (!(color_type == 2 && raster[row][col].length == 3) &&
          !(color_type == 6 && raster[row][col].length == 4)) {
        throw new Error("Not RGB[A] at ("+row+","+col+")");
      }
      for (var i = 0; i < (color_type == 2 ? 3 : 4); i++) {
        if (raster[row][col][i]<0 || raster[row][col][i]>255) {
          throw new Error("RGB out of range at ("+row+","+col+")");
        }
      }
    }
  }

  this.height = raster.length;
  this.width = cols;

  this.encode = function() {
    // Returns the image data as a single array of bytes, using filter method 0.
    var buffer = [];
    for (var row = 0; row < raster.length; row++) {
      buffer.push(0); // each row gets filter type 0.
      for (var col = 0; col < cols; col++) {
        buffer.push.apply(buffer, raster[row][col]);
      }
    }
    return buffer;
  };
};

png.Chunk.IDAT = function(raster) {
  var encoded = raster.encode();
  var zipped = new Zlib.Deflate(encoded).compress();
  return new png.Chunk("IDAT", new png.Bytes(zipped));
};

png.Chunk.IEND = function() {
  return new png.Chunk("IEND", new png.Bytes([]));
};

if (typeof module !== 'undefined') {
  module.exports = png;
}
