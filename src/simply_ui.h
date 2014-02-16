#pragma once

#include <pebble.h>

typedef struct SimplyStyle SimplyStyle;

typedef struct SimplyUi SimplyUi;

struct SimplyUi {
  Window *window;
  const SimplyStyle *style;
  char *title_text;
  char *subtitle_text;
  char *body_text;
  ScrollLayer *scroll_layer;
  Layer *display_layer;
  bool is_scrollable;
  uint32_t button_mask;
};

SimplyUi *simply_ui_create(void);

void simply_ui_destroy(SimplyUi *self);

void simply_ui_show(SimplyUi *self);

void simply_ui_set_style(SimplyUi *self, int style_index);

void simply_ui_set_text(SimplyUi *self, char **str_field, const char *str);

void simply_ui_set_scrollable(SimplyUi *self, bool is_scrollable);

void simply_ui_set_fullscreen(SimplyUi *self, bool is_fullscreen);

void simply_ui_set_button(SimplyUi *self, ButtonId button, bool enable);

