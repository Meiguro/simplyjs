#pragma once

#include "simplyjs.h"

#include <pebble.h>

typedef struct SimplySplash SimplySplash;

struct SimplySplash {
  Simply *simply;
  Window *window;
  BitmapLayer *logo_layer;
  GBitmap *logo;
};

SimplySplash *simply_splash_create(Simply *simply);

void simply_splash_destroy(SimplySplash *self);
