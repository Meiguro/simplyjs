#pragma once

#include "simplyjs.h"

#include <pebble.h>

typedef struct SimplyWindow SimplyWindow;

struct SimplyWindow {
  Simply *simply;
  Window *window;
  ScrollLayer *scroll_layer;
  Layer *layer;
  ActionBarLayer *action_bar_layer;
  uint32_t id;
  uint32_t button_mask;
  bool is_scrollable;
  bool is_action_bar;
};

SimplyWindow *simply_window_init(SimplyWindow *self, Simply *simply);
void simply_window_deinit(SimplyWindow *self);
void simply_window_show(SimplyWindow *self);

void simply_window_load(SimplyWindow *self);
void simply_window_unload(SimplyWindow *self);

void simply_window_set_scrollable(SimplyWindow *self, bool is_scrollable);
void simply_window_set_fullscreen(SimplyWindow *self, bool is_fullscreen);

void simply_window_set_button(SimplyWindow *self, ButtonId button, bool enable);

void simply_window_set_action_bar(SimplyWindow *self, bool is_action_bar);
void simply_window_set_action_bar_icon(SimplyWindow *self, ButtonId button, uint32_t id);
void simply_window_action_bar_clear(SimplyWindow *self);
