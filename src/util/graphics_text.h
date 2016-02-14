#pragma once

#include <pebble.h>

#define TEXT_FLOW_DEFAULT_INSET 8

static inline void graphics_text_attributes_enable_paging_on_layer(
    GTextAttributes *text_attributes, const Layer *layer, const GRect *box, const int inset) {
  graphics_text_attributes_enable_screen_text_flow(text_attributes, inset);
  const GPoint origin_on_screen = layer_convert_point_to_screen(layer, box->origin);
  const GRect paging_on_screen =
      layer_convert_rect_to_screen(layer, (GRect) { .size = layer_get_bounds(layer).size });
  graphics_text_attributes_enable_paging(text_attributes, origin_on_screen, paging_on_screen);
}

