#include "simply_menu.h"

#include "simply_res.h"
#include "simply_msg.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/menu_layer.h"
#include "util/string.h"

#include <pebble.h>

#define MAX_CACHED_SECTIONS 10

#define MAX_CACHED_ITEMS 6

#define REQUEST_DELAY_MS 10

typedef Packet MenuClearPacket;

typedef struct MenuClearSectionPacket MenuClearSectionPacket;

struct __attribute__((__packed__)) MenuClearSectionPacket {
  Packet packet;
  uint16_t section;
};

typedef struct MenuPropsPacket MenuPropsPacket;

struct __attribute__((__packed__)) MenuPropsPacket {
  Packet packet;
  uint16_t num_sections;
};

typedef struct MenuSectionPacket MenuSectionPacket;

struct __attribute__((__packed__)) MenuSectionPacket {
  Packet packet;
  uint16_t section;
  uint16_t num_items;
  uint16_t title_length;
  char title[];
};

typedef struct MenuItemPacket MenuItemPacket;

struct __attribute__((__packed__)) MenuItemPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
  uint32_t icon;
  uint16_t title_length;
  uint16_t subtitle_length;
  char buffer[];
};

typedef struct MenuItemEventPacket MenuItemEventPacket;

struct __attribute__((__packed__)) MenuItemEventPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
};

typedef Packet MenuGetSelectionPacket;

typedef struct MenuSelectionPacket MenuSelectionPacket;

struct __attribute__((__packed__)) MenuSelectionPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
  MenuRowAlign align:8;
  bool animated;
};

static void simply_menu_clear_section_items(SimplyMenu *self, int section_index);
static void simply_menu_clear(SimplyMenu *self);

static void simply_menu_set_num_sections(SimplyMenu *self, uint16_t num_sections);
static void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section);
static void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item);

static MenuIndex simply_menu_get_selection(SimplyMenu *self);
static void simply_menu_set_selection(SimplyMenu *self, MenuIndex menu_index, MenuRowAlign align, bool animated);

static char EMPTY_TITLE[] = "";

static bool send_menu_item(Command type, uint16_t section, uint16_t item) {
  MenuItemEventPacket packet = {
    .packet.type = type,
    .packet.length = sizeof(packet),
    .section = section,
    .item = item,
  };
  return simply_msg_send_packet(&packet.packet);
}

static bool send_menu_get_section(uint16_t index) {
  return send_menu_item(CommandMenuGetSection, index, 0);
}

static bool send_menu_get_item(uint16_t section, uint16_t index) {
  return send_menu_item(CommandMenuGetItem, section, index);
}

static bool send_menu_select_click(uint16_t section, uint16_t index) {
  return send_menu_item(CommandMenuSelect, section, index);
}

static bool send_menu_select_long_click(uint16_t section, uint16_t index) {
  return send_menu_item(CommandMenuLongSelect, section, index);
}

static bool section_filter(List1Node *node, void *data) {
  SimplyMenuCommon *section = (SimplyMenuCommon*) node;
  uint16_t section_index = (uint16_t)(uintptr_t) data;
  return (section->section == section_index);
}

static bool item_filter(List1Node *node, void *data) {
  SimplyMenuItem *item = (SimplyMenuItem*) node;
  uint32_t cell_index = (uint32_t)(uintptr_t) data;
  uint16_t section_index = cell_index;
  uint16_t row = cell_index >> 16;
  return (item->section == section_index && item->item == row);
}

static SimplyMenuSection *get_menu_section(SimplyMenu *self, int index) {
  return (SimplyMenuSection*) list1_find(self->menu_layer.sections, section_filter, (void*)(uintptr_t) index);
}

static void destroy_section(SimplyMenu *self, SimplyMenuSection *section) {
  if (!section) { return; }
  list1_remove(&self->menu_layer.sections, &section->node);
  if (section->title && section->title != EMPTY_TITLE) {
    free(section->title);
    section->title = NULL;
  }
  free(section);
}

static void destroy_section_by_index(SimplyMenu *self, int section) {
  destroy_section(self, (SimplyMenuSection*) list1_find(
        self->menu_layer.sections, section_filter, (void*)(uintptr_t) section));
}

static SimplyMenuItem *get_menu_item(SimplyMenu *self, int section, int index) {
  uint32_t cell_index = section | (index << 16);
  return (SimplyMenuItem*) list1_find(self->menu_layer.items, item_filter, (void*)(uintptr_t) cell_index);
}

static void destroy_item(SimplyMenu *self, SimplyMenuItem *item) {
  if (!item) { return; }
  list1_remove(&self->menu_layer.items, &item->node);
  if (item->title) {
    free(item->title);
    item->title = NULL;
  }
  if (item->subtitle) {
    free(item->subtitle);
    item->subtitle = NULL;
  }
  free(item);
}

static void destroy_item_by_index(SimplyMenu *self, int section, int index) {
  uint32_t cell_index = section | (index << 16);
  destroy_item(self, (SimplyMenuItem*) list1_find(
        self->menu_layer.items, item_filter, (void*)(uintptr_t) cell_index));
}

static void add_section(SimplyMenu *self, SimplyMenuSection *section) {
  if (list1_size(self->menu_layer.sections) >= MAX_CACHED_SECTIONS) {
    destroy_section(self, (SimplyMenuSection*) list1_last(self->menu_layer.sections));
  }
  destroy_section_by_index(self, section->section);
  list1_prepend(&self->menu_layer.sections, &section->node);
}

static void add_item(SimplyMenu *self, SimplyMenuItem *item) {
  if (list1_size(self->menu_layer.items) >= MAX_CACHED_ITEMS) {
    destroy_item(self, (SimplyMenuItem*) list1_last(self->menu_layer.items));
  }
  destroy_item_by_index(self, item->section, item->item);
  list1_prepend(&self->menu_layer.items, &item->node);
}

static void request_menu_section(SimplyMenu *self, uint16_t section_index) {
  SimplyMenuSection *section = get_menu_section(self, section_index);
  if (section) {
    return;
  }
  section = malloc(sizeof(*section));
  *section = (SimplyMenuSection) {
    .section = section_index,
  };
  add_section(self, section);
  send_menu_get_section(section_index);
}

static void request_menu_item(SimplyMenu *self, uint16_t section_index, uint16_t item_index) {
  SimplyMenuItem *item = get_menu_item(self, section_index, item_index);
  if (item) {
    return;
  }
  item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = section_index,
    .item = item_index,
  };
  add_item(self, item);
  send_menu_get_item(section_index, item_index);
}

static void mark_dirty(SimplyMenu *self) {
  if (!self->menu_layer.menu_layer) { return; }
  menu_layer_reload_data(self->menu_layer.menu_layer);
}

void simply_menu_set_num_sections(SimplyMenu *self, uint16_t num_sections) {
  if (num_sections == 0) {
    num_sections = 1;
  }
  self->menu_layer.num_sections = num_sections;
  mark_dirty(self);
}

void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section) {
  if (section->title == NULL) {
    section->title = EMPTY_TITLE;
  }
  add_section(self, section);
  mark_dirty(self);
}

void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item) {
  if (item->title == NULL) {
    item->title = EMPTY_TITLE;
  }
  add_item(self, item);
  mark_dirty(self);
}

MenuIndex simply_menu_get_selection(SimplyMenu *self) {
  return menu_layer_get_selected_index(self->menu_layer.menu_layer);
}

void simply_menu_set_selection(SimplyMenu *self, MenuIndex menu_index, MenuRowAlign align, bool animated) {
  menu_layer_set_selected_index(self->menu_layer.menu_layer, menu_index, align, animated);
}

static bool send_menu_selection(SimplyMenu *self) {
  MenuIndex menu_index = simply_menu_get_selection(self);
  return send_menu_item(CommandMenuSelectionEvent, menu_index.section, menu_index.row);
}

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  SimplyMenu *self = data;
  return self->menu_layer.num_sections;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, section_index);
  return section ? section->num_items : 1;
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, section_index);
  return section && section->title && section->title != EMPTY_TITLE ? MENU_CELL_BASIC_HEADER_HEIGHT : 0;
}

static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, section_index);
  if (!section) {
    request_menu_section(self, section_index);
    return;
  }

  list1_remove(&self->menu_layer.sections, &section->node);
  list1_prepend(&self->menu_layer.sections, &section->node);

  menu_cell_basic_header_draw(ctx, cell_layer, section->title);
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, cell_index->section);
  if (!section) {
    request_menu_section(self, cell_index->section);
    return;
  }
  SimplyMenuItem *item = get_menu_item(self, cell_index->section, cell_index->row);
  if (!item) {
    request_menu_item(self, cell_index->section, cell_index->row);
    return;
  }

  list1_remove(&self->menu_layer.items, &item->node);
  list1_prepend(&self->menu_layer.items, &item->node);

  GBitmap *bitmap = simply_res_get_image(self->window.simply->res, item->icon);
  menu_cell_basic_draw(ctx, cell_layer, item->title, item->subtitle, bitmap);
}

static void menu_select_click_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  send_menu_select_click(cell_index->section, cell_index->row);
}

static void menu_select_long_click_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  send_menu_select_long_click(cell_index->section, cell_index->row);
}

static void single_click_handler(ClickRecognizerRef recognizer, void *context) {
  Window *base_window = layer_get_window(context);
  SimplyWindow *window = window_get_user_data(base_window);
  simply_window_single_click_handler(recognizer, window);
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_BACK, single_click_handler);
  menu_layer_click_config(context);
}

static void window_load(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  simply_window_load(&self->window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  MenuLayer *menu_layer = self->menu_layer.menu_layer = menu_layer_create(frame);
  Layer *menu_base_layer = menu_layer_get_layer(menu_layer);
  self->window.layer = menu_base_layer;
  layer_add_child(window_layer, menu_base_layer);

  menu_layer_set_callbacks(menu_layer, self, (MenuLayerCallbacks){
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_header = menu_draw_header_callback,
    .draw_row = menu_draw_row_callback,
    .select_click = menu_select_click_callback,
    .select_long_click = menu_select_long_click_callback,
  });

  menu_layer_set_click_config_provider_onto_window(menu_layer, click_config_provider, window);
}

static void window_appear(Window *window) {
  SimplyMenu *self = window_get_user_data(window);
  simply_window_stack_send_show(self->window.simply->window_stack, &self->window);
}

static void window_disappear(Window *window) {
  SimplyMenu *self = window_get_user_data(window);
  simply_window_stack_send_hide(self->window.simply->window_stack, &self->window);

  simply_res_clear(self->window.simply->res);
  simply_menu_clear(self);
}

static void window_unload(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  menu_layer_destroy(self->menu_layer.menu_layer);
  self->menu_layer.menu_layer = NULL;

  simply_window_unload(&self->window);
}

void simply_menu_clear_section_items(SimplyMenu *self, int section_index) {
  SimplyMenuItem *item = NULL;
  do {
    item = (SimplyMenuItem*) list1_find(self->menu_layer.items, section_filter, (void*)(uintptr_t) section_index);
    destroy_item(self, item);
  } while (item);
}

void simply_menu_clear(SimplyMenu *self) {
  while (self->menu_layer.sections) {
    destroy_section(self, (SimplyMenuSection*) self->menu_layer.sections);
  }

  while (self->menu_layer.items) {
    destroy_item(self, (SimplyMenuItem*) self->menu_layer.items);
  }

  mark_dirty(self);
}

static void handle_menu_clear_packet(Simply *simply, Packet *data) {
  simply_menu_clear(simply->menu);
}

static void handle_menu_clear_section_packet(Simply *simply, Packet *data) {
  MenuClearSectionPacket *packet = (MenuClearSectionPacket*) data;
  simply_menu_clear_section_items(simply->menu, packet->section);
}

static void handle_menu_props_packet(Simply *simply, Packet *data) {
  MenuPropsPacket *packet = (MenuPropsPacket*) data;
  simply_menu_set_num_sections(simply->menu, packet->num_sections);
}

static void handle_menu_section_packet(Simply *simply, Packet *data) {
  MenuSectionPacket *packet = (MenuSectionPacket*) data;
  SimplyMenuSection *section = malloc(sizeof(*section));
  *section = (SimplyMenuSection) {
    .section = packet->section,
    .num_items = packet->num_items,
    .title = packet->title_length ? strdup2(packet->title) : NULL,
  };
  simply_menu_add_section(simply->menu, section);
}

static void handle_menu_item_packet(Simply *simply, Packet *data) {
  MenuItemPacket *packet = (MenuItemPacket*) data;
  SimplyMenuItem *item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = packet->section,
    .item = packet->item,
    .title = packet->title_length ? strdup2(packet->buffer) : NULL,
    .subtitle = packet->subtitle_length ? strdup2(packet->buffer + packet->title_length + 1) : NULL,
    .icon = packet->icon,
  };
  simply_menu_add_item(simply->menu, item);
}

static void handle_menu_get_selection_packet(Simply *simply, Packet *data) {
  send_menu_selection(simply->menu);
}

static void handle_menu_selection_packet(Simply *simply, Packet *data) {
  MenuSelectionPacket *packet = (MenuSelectionPacket*) data;
  MenuIndex menu_index = {
    .section = packet->section,
    .row = packet->item,
  };
  simply_menu_set_selection(simply->menu, menu_index, packet->align, packet->animated);
}

bool simply_menu_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandMenuClear:
      handle_menu_clear_packet(simply, packet);
      return true;
    case CommandMenuClearSection:
      handle_menu_clear_section_packet(simply, packet);
      return true;
    case CommandMenuProps:
      handle_menu_props_packet(simply, packet);
      return true;
    case CommandMenuSection:
      handle_menu_section_packet(simply, packet);
      return true;
    case CommandMenuItem:
      handle_menu_item_packet(simply, packet);
      return true;
    case CommandMenuSelection:
      handle_menu_selection_packet(simply, packet);
      return true;
    case CommandMenuGetSelection:
      handle_menu_get_selection_packet(simply, packet);
      return true;
  }
  return false;
}

SimplyMenu *simply_menu_create(Simply *simply) {
  SimplyMenu *self = malloc(sizeof(*self));
  *self = (SimplyMenu) {
    .window.simply = simply,
    .menu_layer.num_sections = 1,
  };

  simply_window_init(&self->window, simply);

  window_set_user_data(self->window.window, self);
  window_set_background_color(self->window.window, GColorWhite);
  window_set_window_handlers(self->window.window, (WindowHandlers) {
    .load = window_load,
    .appear = window_appear,
    .disappear = window_disappear,
    .unload = window_unload,
  });

  return self;
}

void simply_menu_destroy(SimplyMenu *self) {
  if (!self) {
    return;
  }

  simply_window_deinit(&self->window);

  free(self);
}
