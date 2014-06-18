#pragma once

#include "simply.h"

#include <pebble.h>

typedef struct SimplySplash SimplySplash;

struct SimplySplash {
  Simply *simply;
  Window *window;
  GBitmap *image;
};

SimplySplash *simply_splash_create(Simply *simply);

void simply_splash_destroy(SimplySplash *self);
