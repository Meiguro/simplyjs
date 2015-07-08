#pragma once

#include "simply_window.h"

#include "simply_msg.h"

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

struct SimplyMenuCommon {
  List1Node node;
  uint16_t section;
  char *title;
};

typedef struct SimplyMenuCommonMember SimplyMenuCommonMember;

struct SimplyMenuCommonMember {
  union {
    SimplyMenuCommon common;
    SimplyMenuCommon;
  };
};

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

bool simply_menu_handle_packet(Simply *simply, Packet *packet);
