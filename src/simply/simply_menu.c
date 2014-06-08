#include "simply_menu.h"

#include "simply_res.h"
#include "simply_msg.h"
#include "simply_window_stack.h"

#include "simply.h"

#include <pebble.h>

#define MAX_CACHED_SECTIONS 10

#define MAX_CACHED_ITEMS 6

#define REQUEST_DELAY_MS 10

static char EMPTY_TITLE[] = "";

static bool section_filter(List1Node *node, void *data) {
  SimplyMenuSection *section = (SimplyMenuSection*) node;
  uint16_t section_index = (uint16_t)(uintptr_t) data;
  return (section->index == section_index);
}

static bool item_filter(List1Node *node, void *data) {
  SimplyMenuItem *item = (SimplyMenuItem*) node;
  uint32_t cell_index = (uint32_t)(uintptr_t) data;
  uint16_t section_index = cell_index;
  uint16_t row = cell_index >> 16;
  return (item->section == section_index && item->index == row);
}

static bool request_filter(List1Node *node, void *data) {
  SimplyMenuCommon *item = (SimplyMenuCommon*) node;
  return (item->title == NULL);
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

static void schedule_get_timer(SimplyMenu *self);

static void request_menu_node(void *data) {
  SimplyMenu *self = data;
  self->menu_layer.get_timer = NULL;
  SimplyMenuSection *section = (SimplyMenuSection*) list1_find(self->menu_layer.sections, request_filter, NULL);
  bool found = false;
  if (section) {
    simply_msg_menu_get_section(self->window.simply->msg, section->index);
    found = true;
  }
  SimplyMenuItem *item = (SimplyMenuItem*) list1_find(self->menu_layer.items, request_filter, NULL);
  if (item) {
    simply_msg_menu_get_item(self->window.simply->msg, item->section, item->index);
    found = true;
  }
  if (found) {
    schedule_get_timer(self);
  }
}

static void schedule_get_timer(SimplyMenu *self) {
  if (self->menu_layer.get_timer) { return; }
  self->menu_layer.get_timer = app_timer_register(self->menu_layer.request_delay_ms, request_menu_node, self);
  self->menu_layer.request_delay_ms *= 2;
}

static void add_section(SimplyMenu *self, SimplyMenuSection *section) {
  if (list1_size(self->menu_layer.sections) >= MAX_CACHED_SECTIONS) {
    destroy_section(self, (SimplyMenuSection*) list1_last(self->menu_layer.sections));
  }
  destroy_section_by_index(self, section->index);
  list1_append(&self->menu_layer.sections, &section->node);
}

static void add_item(SimplyMenu *self, SimplyMenuItem *item) {
  if (list1_size(self->menu_layer.items) >= MAX_CACHED_ITEMS) {
    destroy_item(self, (SimplyMenuItem*) list1_last(self->menu_layer.items));
  }
  destroy_item_by_index(self, item->section, item->index);
  list1_append(&self->menu_layer.items, &item->node);
}

static void request_menu_section(SimplyMenu *self, uint16_t section_index) {
  SimplyMenuSection *section = malloc(sizeof(*section));
  *section = (SimplyMenuSection) {
    .index = section_index,
  };
  add_section(self, section);
  schedule_get_timer(self);
}

static void request_menu_item(SimplyMenu *self, uint16_t section_index, uint16_t item_index) {
  SimplyMenuItem *item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = section_index,
    .index = item_index,
  };
  add_item(self, item);
  schedule_get_timer(self);
}

static void mark_dirty(SimplyMenu *self) {
  if (!self->menu_layer.menu_layer) { return; }
  menu_layer_reload_data(self->menu_layer.menu_layer);
  request_menu_node(self);
  self->menu_layer.request_delay_ms = REQUEST_DELAY_MS;
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
  SimplyMenu *self = data;
  simply_msg_menu_select_click(self->window.simply->msg, cell_index->section, cell_index->row);
}

static void menu_select_long_click_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  SimplyMenu *self = data;
  simply_msg_menu_select_long_click(self->window.simply->msg, cell_index->section, cell_index->row);
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

  menu_layer_set_click_config_onto_window(menu_layer, window);
}

static void window_appear(Window *window) {
  SimplyMenu *self = window_get_user_data(window);
  simply_window_stack_send_show(self->window.simply->window_stack, &self->window);
}

static void window_disappear(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  simply_menu_clear(self);
}

static void window_unload(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  menu_layer_destroy(self->menu_layer.menu_layer);
  self->menu_layer.menu_layer = NULL;

  simply_window_unload(&self->window);

  simply_window_stack_send_hide(self->window.simply->window_stack, &self->window);
}

void simply_menu_clear(SimplyMenu *self) {
  if (self->menu_layer.get_timer) {
    app_timer_cancel(self->menu_layer.get_timer);
    self->menu_layer.get_timer = NULL;
  }

  while (self->menu_layer.sections) {
    destroy_section(self, (SimplyMenuSection*) self->menu_layer.sections);
  }

  while (self->menu_layer.items) {
    destroy_item(self, (SimplyMenuItem*) self->menu_layer.items);
  }

  mark_dirty(self);
}

SimplyMenu *simply_menu_create(Simply *simply) {
  SimplyMenu *self = malloc(sizeof(*self));
  *self = (SimplyMenu) {
    .window.simply = simply,
    .menu_layer.num_sections = 1,
    .menu_layer.request_delay_ms = REQUEST_DELAY_MS,
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
