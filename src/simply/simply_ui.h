#pragma once

#include "simply_window.h"

#include "simply.h"

#include <pebble.h>

typedef struct SimplyStyle SimplyStyle;

typedef struct SimplyUiLayer SimplyUiLayer;

typedef struct SimplyUi SimplyUi;

typedef enum SimplyUiTextfield SimplyUiTextfield;

typedef enum SimplyUiImagefield SimplyUiImagefield;

enum SimplyUiTextfield {
  UiTitle = 0,
  UiSubtitle,
  UiBody,
  NumUiTextfields,
};

enum SimplyUiImagefield {
  UiTitleIcon,
  UiSubtitleIcon,
  UiBodyImage,
  NumUiImagefields,
};

struct SimplyUiLayer {
  Layer *layer;
  const SimplyStyle *style;
  char *textfields[3];
  uint32_t imagefields[3];
  GFont custom_body_font;
};

struct SimplyUi {
  SimplyWindow window;
  SimplyUiLayer ui_layer;
};

SimplyUi *simply_ui_create(Simply *simply);
void simply_ui_destroy(SimplyUi *self);

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask);

void simply_ui_set_style(SimplyUi *self, int style_index);
void simply_ui_set_text(SimplyUi *self, SimplyUiTextfield textfield, const char *str);

