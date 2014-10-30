#pragma once

#include <pebble.h>

#include "simply/simply.h"

static inline ClickConfigProvider scroll_layer_click_config_provider_accessor(ClickConfigProvider provider) {
  static ClickConfigProvider s_provider;
  if (provider) {
    s_provider = provider;
  }
  return s_provider;
}

static inline void scroll_layer_click_config(void *context) {
  window_set_click_context(BUTTON_ID_UP, context);
  window_set_click_context(BUTTON_ID_DOWN, context);
  scroll_layer_click_config_provider_accessor(NULL)(context);
}

static inline void scroll_layer_set_click_config_provider_onto_window(ScrollLayer *scroll_layer,
    ClickConfigProvider click_config_provider, Window *window, void *context) {
  scroll_layer_set_click_config_onto_window(scroll_layer, window);
  scroll_layer_click_config_provider_accessor(window_get_click_config_provider(window));
  window_set_click_config_provider_with_context(window, click_config_provider, context);
}
