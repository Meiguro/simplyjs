#pragma once

#include "util/list1.h"

#include <pebble.h>

typedef struct SimplyMenu SimplyMenu;

typedef struct SimplyMenuSection SimplyMenuSection;

typedef struct SimplyMenuItem SimplyMenuItem;

typedef enum SimplyMenuType SimplyMenuType;

enum SimplyMenuType {
  SimplyMenuTypeNone = 0,
  SimplyMenuTypeSection,
  SimplyMenuTypeItem,
};

struct SimplyMenu {
  Window *window;
  MenuLayer *menu_layer;
  List1Node *sections;
  List1Node *items;
  AppTimer *get_timer;
  uint32_t request_delay_ms;
  uint32_t num_sections;
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
  uint16_t section;
  uint16_t index;
};

SimplyMenu *simply_menu_create(void);

void simply_menu_destroy(SimplyMenu *self);

void simply_menu_show(SimplyMenu *self);

void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section);

void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item);
