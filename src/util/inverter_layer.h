#pragma once

#include <pebble.h>

#include "util/math.h"

#ifdef PBL_COLOR

typedef struct InverterLayer InverterLayer;
struct InverterLayer;

static void inverter_layer_update_proc(Layer *layer, GContext *ctx) {
  GBitmap *frame_buffer = graphics_capture_frame_buffer(ctx);
  const size_t bytes_per_row = gbitmap_get_bytes_per_row(frame_buffer);
  GColor8 *data = (GColor8 *)gbitmap_get_data(frame_buffer);

  Layer *window_layer = window_get_root_layer(layer_get_window(layer));
  GRect window_bounds = layer_get_bounds(window_layer);
  GRect window_frame = layer_get_frame(window_layer);
  GRect drawing_box = {
    .origin.x = window_frame.origin.x + window_bounds.origin.x,
    .origin.y = window_frame.origin.y + window_bounds.origin.y,
    .size = window_frame.size,
  };

  // This layer must not be nested in a layer not positioned at origin
  GRect frame = layer_get_frame(layer);

  const int16_t min_x = MAX(0, drawing_box.origin.x + frame.origin.x);
  const int16_t min_y = MAX(0, drawing_box.origin.y + frame.origin.y);
  const int16_t max_x = MIN(drawing_box.size.w, min_x + frame.size.w);
  const int16_t max_y = MIN(drawing_box.size.h, min_y + frame.size.h);

  data += bytes_per_row * min_y;
  for (int16_t y = min_y; y < max_y; y++) {
    for (int16_t x = min_x; x < max_x; x++) {
      data[x] = (GColor8) { .argb = ~data[x].argb };
    }
    data += bytes_per_row;
  }

  graphics_release_frame_buffer(ctx, frame_buffer);
}

static inline InverterLayer *inverter_layer_create(GRect bounds) {
  Layer *layer = layer_create(bounds);
  layer_set_update_proc(layer, inverter_layer_update_proc);
  return (InverterLayer *)layer;
}

static inline void inverter_layer_destroy(InverterLayer *inverter_layer) {
  layer_destroy((Layer *)inverter_layer);
}

static inline Layer *inverter_layer_get_layer(InverterLayer *inverter_layer) {
  return (Layer *)inverter_layer;
}

#endif
