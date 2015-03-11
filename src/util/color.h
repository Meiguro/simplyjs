#pragma once

#include "util/compat.h"

#include <pebble.h>

#define GColor8White (GColor8){.argb=GColorWhiteARGB8}
#define GColor8Black (GColor8){.argb=GColorBlackARGB8}
#define GColor8Clear (GColor8){.argb=GColorClearARGB8}

#ifndef PBL_COLOR

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

