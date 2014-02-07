#pragma once

#include <pebble.h>

typedef struct SimplyStyle SimplyStyle;

typedef struct SimplyData SimplyData;

struct SimplyData {
  Window *window;
  const SimplyStyle *style;
  char *title_text;
  char *subtitle_text;
  char *body_text;
  ScrollLayer *scroll_layer;
  Layer *display_layer;
  bool is_scrollable;
};

SimplyData *simply_create(void);

void simply_destroy(SimplyData *simply);

void simply_set_style(SimplyData *simply, int style_index);

void simply_set_text(SimplyData *simply, char **str_field, const char *str);

void simply_set_scrollable(SimplyData *simply, bool is_scrollable);

void simply_set_fullscreen(SimplyData *simply, bool is_fullscreen);
