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
  uint16_t num_sections;
};

struct SimplyMenu {
  SimplyWindow window;
  SimplyMenuLayer menu_layer;
};

typedef struct SimplyMenuCommon SimplyMenuCommon;

#define SimplyMenuCommonDef { \
  List1Node node;             \
  uint16_t section;           \
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
  uint16_t num_items;
};

struct SimplyMenuItem {
  SimplyMenuCommonMember;
  char *subtitle;
  uint32_t icon;
  uint16_t item;
};

SimplyMenu *simply_menu_create(Simply *simply);
void simply_menu_destroy(SimplyMenu *self);

void simply_menu_clear_section_items(SimplyMenu *self, int section_index);
void simply_menu_clear(SimplyMenu *self);

void simply_menu_set_num_sections(SimplyMenu *self, uint16_t num_sections);
void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section);
void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item);

MenuIndex simply_menu_get_selection(SimplyMenu *self);
void simply_menu_set_selection(SimplyMenu *self, MenuIndex menu_index, MenuRowAlign align, bool animated);

