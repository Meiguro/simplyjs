#pragma once

#include "simply_window.h"

#include "simply.h"

#include <pebble.h>

typedef struct SimplyStyle SimplyStyle;

typedef enum SimplyUiTextfieldId SimplyUiTextfieldId;

enum SimplyUiTextfieldId {
  UiTitle = 0,
  UiSubtitle,
  UiBody,
  NumUiTextfields,
};

typedef enum SimplyUiImagefieldId SimplyUiImagefieldId;

enum SimplyUiImagefieldId {
  UiTitleIcon,
  UiSubtitleIcon,
  UiBodyImage,
  NumUiImagefields,
};

typedef struct SimplyUiTextfield SimplyUiTextfield;

struct SimplyUiTextfield {
  char *text;
  GColor8 color;
};

typedef struct SimplyUiLayer SimplyUiLayer;

struct SimplyUiLayer {
  Layer *layer;
  const SimplyStyle *style;
  SimplyUiTextfield textfields[3];
  uint32_t imagefields[3];
  GFont custom_body_font;
};

typedef struct SimplyUi SimplyUi;

struct SimplyUi {
  SimplyWindow window;
  SimplyUiLayer ui_layer;
};

SimplyUi *simply_ui_create(Simply *simply);
void simply_ui_destroy(SimplyUi *self);

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask);

void simply_ui_set_style(SimplyUi *self, int style_index);
void simply_ui_set_text(SimplyUi *self, SimplyUiTextfieldId textfield_id, const char *str);
void simply_ui_set_text_color(SimplyUi *self, SimplyUiTextfieldId textfield_id, GColor8 color);

bool simply_ui_handle_packet(Simply *simply, Packet *packet);
