#pragma once

#include <pebble.h>

#ifdef PBL_BW

typedef enum GBitmapFormat {
  GBitmapFormat1Bit = 0, //<! 1-bit black and white. 0 = black, 1 = white.
} GBitmapFormat;

static inline GBitmap *gbitmap_create_blank_with_format(GSize size, GBitmapFormat format) {
  return gbitmap_create_blank(size);
}

#define gbitmap_create_blank gbitmap_create_blank_with_format

static inline GRect gbitmap_get_bounds(GBitmap *bitmap) {
  return bitmap->bounds;
}

static inline uint8_t *gbitmap_get_data(GBitmap *bitmap) {
  return bitmap->addr;
}

static inline void gbitmap_set_data(GBitmap *bitmap, uint8_t *data, GBitmapFormat format,
    uint16_t row_size_bytes, bool free_on_destroy) {
  bitmap->is_heap_allocated = free_on_destroy;
  bitmap->row_size_bytes = row_size_bytes;
  bitmap->addr = data;
}

static inline uint16_t gbitmap_get_bytes_per_row(GBitmap *bitmap) {
  return bitmap->row_size_bytes;
}

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
