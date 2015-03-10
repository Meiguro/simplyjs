#pragma once

#include "util/compat.h"

#include <pebble.h>

#ifndef PBL_COLOR

static inline GBitmap *gbitmap_create_blank_with_format(GSize size, GBitmapFormat format) {
  return gbitmap_create_blank(size);
}

#define gbitmap_create_blank gbitmap_create_blank_with_format

#endif

static inline GRect grect_center_rect(const GRect *rect_a, const GRect *rect_b) {
  return (GRect) {
    .origin = {
      .x = rect_a->origin.x + (rect_a->size.w - rect_b->size.w) / 2,
      .y = rect_a->origin.y + (rect_a->size.h - rect_b->size.h) / 2,
    },
    .size = rect_b->size,
  };
}

static inline void graphics_draw_bitmap_centered(GContext *ctx, GBitmap *bitmap, const GRect frame) {
  GRect bounds = gbitmap_get_bounds(bitmap);
  graphics_draw_bitmap_in_rect(ctx, bitmap, grect_center_rect(&frame, &bounds));
}
