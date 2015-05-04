#pragma once

#include <pebble.h>

#include "simply/simply.h"

#ifndef PBL_PLATFORM_BASALT

typedef struct StatusBarLayer StatusBarLayer;
struct StatusBarLayer;

static inline StatusBarLayer *status_bar_layer_create(void) {
  return NULL;
}

static inline void status_bar_layer_destroy(StatusBarLayer *status_bar_layer) {
}

static inline Layer *status_bar_layer_get_layer(StatusBarLayer *status_bar_layer) {
  return (Layer *)status_bar_layer;
}

static inline void status_bar_layer_add_to_window(Window *window, StatusBarLayer *status_bar_layer) {
  window_set_fullscreen(window, false);
}

static inline void status_bar_layer_remove_from_window(Window *window, StatusBarLayer *status_bar_layer) {
  window_set_fullscreen(window, true);
}

#else

static inline void status_bar_layer_add_to_window(Window *window, StatusBarLayer *status_bar_layer) {
  Layer *status_bar_base_layer = status_bar_layer_get_layer(status_bar_layer);
  GRect status_frame = layer_get_frame(status_bar_base_layer);
  status_frame.origin.y = -STATUS_BAR_LAYER_HEIGHT;
  layer_set_frame(status_bar_base_layer, status_frame);

  Layer *window_layer = window_get_root_layer(window);
  layer_add_child(window_layer, status_bar_base_layer);

  GRect bounds = layer_get_bounds(window_layer);
  if (bounds.origin.y == 0) {
    bounds.origin.y = STATUS_BAR_LAYER_HEIGHT;
    bounds.size.h -= STATUS_BAR_LAYER_HEIGHT;

    GRect frame = layer_get_frame(window_layer);
    frame.size.h = bounds.size.h;

    layer_set_frame(window_layer, frame);
    layer_set_bounds(window_layer, bounds);
    layer_set_clips(window_layer, false);
  }
}

static inline void status_bar_layer_remove_from_window(Window *window, StatusBarLayer *status_bar_layer) {
  layer_remove_from_parent(status_bar_layer_get_layer(status_bar_layer));
  Layer *window_layer = window_get_root_layer(window);

  GRect bounds = layer_get_bounds(window_layer);
  if (bounds.origin.y == STATUS_BAR_LAYER_HEIGHT) {
    bounds.origin.y = 0;
    bounds.size.h += STATUS_BAR_LAYER_HEIGHT;

    GRect frame = layer_get_frame(window_layer);
    frame.size.h = bounds.size.h;

    layer_set_frame(window_layer, frame);
    layer_set_bounds(window_layer, bounds);
    layer_set_clips(window_layer, true);
  }
}

#endif
