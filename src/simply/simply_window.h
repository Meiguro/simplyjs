#pragma once

#include "simply.h"

#include <pebble.h>

typedef struct SimplyWindow SimplyWindow;

struct SimplyWindow {
  Simply *simply;
  Window *window;
  ScrollLayer *scroll_layer;
  Layer *layer;
  ActionBarLayer *action_bar_layer;
  uint32_t id;
  ButtonId button_mask:4;
  GColor background_color:2;
  bool is_fullscreen:1;
  bool is_scrollable:1;
  bool is_action_bar:1;
};

SimplyWindow *simply_window_init(SimplyWindow *self, Simply *simply);
void simply_window_deinit(SimplyWindow *self);
void simply_window_show(SimplyWindow *self);
void simply_window_hide(SimplyWindow *self);

void simply_window_load(SimplyWindow *self);
void simply_window_unload(SimplyWindow *self);

void simply_window_single_click_handler(ClickRecognizerRef recognizer, void *context);

void simply_window_set_scrollable(SimplyWindow *self, bool is_scrollable);
void simply_window_set_fullscreen(SimplyWindow *self, bool is_fullscreen);
void simply_window_set_background_color(SimplyWindow *self, GColor background_color);

void simply_window_set_button(SimplyWindow *self, ButtonId button, bool enable);

void simply_window_set_action_bar(SimplyWindow *self, bool is_action_bar);
void simply_window_set_action_bar_icon(SimplyWindow *self, ButtonId button, uint32_t id);
void simply_window_set_action_bar_background_color(SimplyWindow *self, GColor background_color);
void simply_window_action_bar_clear(SimplyWindow *self);
