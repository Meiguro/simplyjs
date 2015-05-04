#pragma once

#include <pebble.h>

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
  layer_add_child(window_get_root_layer(window), status_bar_layer_get_layer(status_bar_layer));
}

static inline void status_bar_layer_remove_from_window(Window *window, StatusBarLayer *status_bar_layer) {
  layer_remove_from_parent(status_bar_layer_get_layer(status_bar_layer));
}

#endif
