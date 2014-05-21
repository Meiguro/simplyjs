#pragma once

#include "util/list1.h"

#include <pebble.h>

typedef struct SimplyRes SimplyRes;

typedef struct SimplyImage SimplyImage;

struct SimplyRes {
  List1Node *images;
};

struct SimplyImage {
  List1Node node;
  uint32_t id;
  GBitmap bitmap;
};

SimplyRes *simply_res_create();

void simply_res_destroy(SimplyRes *self);

void simply_res_clear(SimplyRes *self);

GBitmap *simply_res_add_image(SimplyRes *self, uint32_t id, int16_t width, int16_t height, uint32_t *pixels);

void simply_res_remove_image(SimplyRes *self, uint32_t id);

GBitmap *simply_res_get_image(SimplyRes *self, uint32_t id);

