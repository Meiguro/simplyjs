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
  Layer *display_layer;
};

SimplyData *simply_create(void);

void simply_destroy(SimplyData *data);
