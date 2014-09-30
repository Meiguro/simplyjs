#pragma once

#include "util/list1.h"

#include <pebble.h>

#define simply_res_get_image(self, id) simply_res_auto_image(self, id, false)

#define simply_res_get_font(self, id) simply_res_auto_font(self, id)

typedef struct SimplyRes SimplyRes;

struct SimplyRes {
  List1Node *images;
  List1Node *fonts;
  uint32_t num_bundled_res;
};

typedef struct SimplyResItemCommon SimplyResItemCommon;

#define SimplyResItemCommonDef { \
  List1Node node;                \
  uint32_t id;                   \
}

struct SimplyResItemCommon SimplyResItemCommonDef;

#define SimplyResItemCommonMember      \
  union {                              \
    struct SimplyResItemCommon common; \
    struct SimplyResItemCommonDef;     \
  }

typedef struct SimplyImage SimplyImage;

struct SimplyImage {
  SimplyResItemCommonMember;
  GBitmap bitmap;
};

typedef struct SimplyFont SimplyFont;

struct SimplyFont {
  SimplyResItemCommonMember;
  GFont font;
};

SimplyRes *simply_res_create();
void simply_res_destroy(SimplyRes *self);
void simply_res_clear(SimplyRes *self);

GBitmap *simply_res_add_bundled_image(SimplyRes *self, uint32_t id);
GBitmap *simply_res_add_image(SimplyRes *self, uint32_t id, int16_t width, int16_t height, uint32_t *pixels);
GBitmap *simply_res_auto_image(SimplyRes *self, uint32_t id, bool is_placeholder);

GFont simply_res_add_custom_font(SimplyRes *self, uint32_t id);
GFont simply_res_auto_font(SimplyRes *self, uint32_t id);

void simply_res_remove_image(SimplyRes *self, uint32_t id);
