#pragma once

#include "simply_window.h"

#include "simply.h"

#include "util/list1.h"

#include <pebble.h>

typedef struct SimplyMenuLayer SimplyMenuLayer;

typedef struct SimplyMenu SimplyMenu;

typedef struct SimplyMenuSection SimplyMenuSection;

typedef struct SimplyMenuItem SimplyMenuItem;

typedef enum SimplyMenuType SimplyMenuType;

enum SimplyMenuType {
  SimplyMenuTypeNone = 0,
  SimplyMenuTypeSection,
  SimplyMenuTypeItem,
};

struct SimplyMenuLayer {
  MenuLayer *menu_layer;
  List1Node *sections;
  List1Node *items;
  AppTimer *get_timer;
  uint32_t request_delay_ms;
  uint16_t num_sections;
};

struct SimplyMenu {
  SimplyWindow window;
  SimplyMenuLayer menu_layer;
};

typedef struct SimplyMenuCommon SimplyMenuCommon;

#define SimplyMenuCommonDef { \
  List1Node node;             \
  char *title;                \
}

struct SimplyMenuCommon SimplyMenuCommonDef;

#define SimplyMenuCommonMember      \
  union {                           \
    struct SimplyMenuCommon common; \
    struct SimplyMenuCommonDef;     \
  }

struct SimplyMenuSection {
  SimplyMenuCommonMember;
  uint16_t index;
  uint16_t num_items;
};

struct SimplyMenuItem {
  SimplyMenuCommonMember;
  char *subtitle;
  uint32_t icon;
  uint16_t section;
  uint16_t index;
};

SimplyMenu *simply_menu_create(Simply *simply);
void simply_menu_destroy(SimplyMenu *self);

void simply_menu_clear(SimplyMenu *self);

void simply_menu_set_num_sections(SimplyMenu *self, uint16_t num_sections);
void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section);
void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item);
