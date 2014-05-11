#pragma once

#include <pebble.h>

typedef struct SimplyMenu SimplyMenu;

struct SimplyMenu {
  Window *window;
  MenuLayer *menu_layer;
};

SimplyMenu *simply_menu_create(void);

void simply_menu_destroy(SimplyMenu *self);

void simply_menu_show(SimplyMenu *self);

