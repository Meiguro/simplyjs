#pragma once

#include <pebble.h>

#include "simply/simply.h"

static inline ClickConfigProvider menu_layer_click_config_provider_accessor(ClickConfigProvider provider) {
  static ClickConfigProvider s_provider;
  if (provider) {
    s_provider = provider;
  }
  return s_provider;
}

static inline void menu_layer_click_config(void *context) {
  menu_layer_click_config_provider_accessor(NULL)(context);
}

static inline void menu_layer_set_click_config_provider_onto_window(MenuLayer *menu_layer,
    ClickConfigProvider click_config_provider, Window *window) {
  menu_layer_set_click_config_onto_window(menu_layer, window);
  menu_layer_click_config_provider_accessor(window_get_click_config_provider(window));
  window_set_click_config_provider_with_context(window, click_config_provider, menu_layer);
}
