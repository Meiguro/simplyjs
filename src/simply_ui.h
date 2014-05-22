#pragma once

#include "simplyjs.h"

#include <pebble.h>

typedef struct SimplyStyle SimplyStyle;

typedef struct SimplyUi SimplyUi;

struct SimplyUi {
  Simply *simply;
  Window *window;
  const SimplyStyle *style;
  char *title_text;
  char *subtitle_text;
  char *body_text;
  uint32_t title_icon;
  uint32_t subtitle_icon;
  uint32_t image;
  ScrollLayer *scroll_layer;
  Layer *display_layer;
  ActionBarLayer *action_bar_layer;
  GFont custom_body_font;
  uint32_t button_mask;
  bool is_scrollable;
  bool is_action_bar;
};

SimplyUi *simply_ui_create(Simply *simply);

void simply_ui_destroy(SimplyUi *self);

void simply_ui_show(SimplyUi *self);

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask);

void simply_ui_set_style(SimplyUi *self, int style_index);

void simply_ui_set_text(SimplyUi *self, char **str_field, const char *str);

void simply_ui_set_scrollable(SimplyUi *self, bool is_scrollable);

void simply_ui_set_fullscreen(SimplyUi *self, bool is_fullscreen);

void simply_ui_set_action_bar(SimplyUi *self, bool is_action_bar);

void simply_ui_set_action_bar_icon(SimplyUi *self, ButtonId button, uint32_t id);

void simply_ui_set_button(SimplyUi *self, ButtonId button, bool enable);

