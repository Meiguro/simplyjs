#pragma once

#include <pebble.h>

#define GColor8White (GColor8){.argb=GColorWhiteARGB8}
#define GColor8Black (GColor8){.argb=GColorBlackARGB8}
#define GColor8Clear (GColor8){.argb=GColorClearARGB8}

#ifdef PBL_BW

#define GColorWhiteARGB8 ((uint8_t)0b11111111)
#define GColorBlackARGB8 ((uint8_t)0b11000000)
#define GColorClearARGB8 ((uint8_t)0b00000000)

typedef union GColor8 {
  uint8_t argb;
  struct {
    uint8_t b:2; //!< Blue
    uint8_t g:2; //!< Green
    uint8_t r:2; //!< Red
    uint8_t a:2; //!< Alpha. 3 = 100% opaque, 2 = 66% opaque, 1 = 33% opaque, 0 = transparent.
  };
} GColor8;

static inline GColor GColor8Get(GColor8 color) {
  switch (color.argb) {
    case GColorWhiteARGB8: return GColorWhite;
    case GColorBlackARGB8: return GColorBlack;
    default: return GColorClear;
  }
}

static inline GColor8 GColorGet8(GColor color) {
  switch (color) {
    case GColorWhite: return GColor8White;
    case GColorBlack: return GColor8Black;
    default: return GColor8Clear;
  }
}

static inline bool GColorEq(GColor color, GColor other) {
  return (color == other);
}

static inline bool GColor8Eq(GColor8 color, GColor other) {
  return (color.argb == GColorGet8(other).argb);
}

#else

static inline bool GColor8Eq(GColor8 color, GColor other) {
  return (color.argb == other.argb);
}

static inline GColor GColor8Get(GColor8 color) {
  return color;
}

#endif

