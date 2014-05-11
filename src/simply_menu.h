#pragma once

#include <pebble.h>

typedef struct SimplyMenu SimplyMenu;

typedef struct SimplyMenuSection SimplyMenuSection;

typedef struct SimplyMenuItem SimplyMenuItem;

struct SimplyMenu {
  Window *window;
  MenuLayer *menu_layer;
  SimplyMenuSection *sections;
  SimplyMenuItem *items;
  int num_sections;
};

struct SimplyMenuSection {
  SimplyMenuSection *next;
  char *title;
  int16_t index;
  int16_t num_items;
};

struct SimplyMenuItem {
  SimplyMenuItem *next;
  char *title;
  char *subtitle;
  int16_t section;
  int16_t index;
};

SimplyMenu *simply_menu_create(void);

void simply_menu_destroy(SimplyMenu *self);

void simply_menu_show(SimplyMenu *self);

