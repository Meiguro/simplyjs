#include "simply_menu.h"

#include "simply_msg.h"

#define MAX_CACHED_SECTIONS 10

#define MAX_CACHED_ITEMS 6

#define REQUEST_DELAY_MS 10

SimplyMenu *s_menu = NULL;

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

static bool empty_filter(List1Node *node, void *data) {
  SimplyMenuCommon *item = (SimplyMenuCommon*) node;
  return (item->title == NULL);
}

static SimplyMenuSection *get_menu_section(SimplyMenu *self, int index) {
  return (SimplyMenuSection*) list1_find(self->sections, section_filter, (void*)(uintptr_t) index);
}

static void free_section(SimplyMenuSection *section) {
  if (!section) { return; }
  if (section->title) {
    free(section->title);
    section->title = NULL;
  }
  free(section);
}

static void remove_menu_section(List1Node **head, int index) {
  free_section((SimplyMenuSection*) list1_remove_one(head, section_filter, (void*)(uintptr_t) index));
}

static SimplyMenuItem *get_menu_item(SimplyMenu *self, int section, int index) {
  uint32_t cell_index = section | (index << 16);
  return (SimplyMenuItem*) list1_find(self->items, item_filter, (void*)(uintptr_t) cell_index);
}

static void free_item(SimplyMenuItem *item) {
  if (!item) { return; }
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

static void remove_menu_item(List1Node **head, int section, int index) {
  uint32_t cell_index = section | (index << 16);
  free_item((SimplyMenuItem*) list1_remove_one(head, item_filter, (void*)(uintptr_t) cell_index));
}

static void schedule_get_timer(SimplyMenu *self);

static void request_menu_node(void *data) {
  SimplyMenu *self = data;
  self->get_timer = NULL;
  SimplyMenuSection *section = (SimplyMenuSection*) list1_find(self->sections, empty_filter, NULL);
  bool found = false;
  if (section) {
    simply_msg_menu_get_section(section->index);
    found = true;
  }
  SimplyMenuItem *item = (SimplyMenuItem*) list1_find(self->items, empty_filter, NULL);
  if (item) {
    simply_msg_menu_get_item(item->section, item->index);
    found = true;
  }
  if (found) {
    schedule_get_timer(self);
  }
}

static void schedule_get_timer(SimplyMenu *self) {
  if (self->get_timer) { return; }
  self->get_timer = app_timer_register(self->request_delay_ms, request_menu_node, self);
  self->request_delay_ms *= 2;
}

static void add_section(SimplyMenu *self, SimplyMenuSection *section) {
  if (list1_size(self->sections) >= MAX_CACHED_SECTIONS) {
    SimplyMenuSection *old_section = (SimplyMenuSection*) list1_last(self->sections);
    remove_menu_section(&self->sections, old_section->index);
  }
  remove_menu_section(&self->sections, section->index);
  list1_prepend(&self->sections, &section->node);
}

static void add_item(SimplyMenu *self, SimplyMenuItem *item) {
  if (list1_size(self->items) >= MAX_CACHED_ITEMS) {
    SimplyMenuItem *old_item = (SimplyMenuItem*) list1_last(self->items);
    remove_menu_item(&self->items, old_item->section, old_item->index);
  }
  remove_menu_item(&self->items, item->section, item->index);
  list1_prepend(&self->items, &item->node);
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
  menu_layer_reload_data(self->menu_layer);
  request_menu_node(self);
  self->request_delay_ms = REQUEST_DELAY_MS;
}

void simply_menu_set_num_sections(SimplyMenu *self, uint16_t num_sections) {
  if (num_sections == 0) {
    num_sections = 1;
  }
  self->num_sections = num_sections;
}

void simply_menu_add_section(SimplyMenu *self, SimplyMenuSection *section) {
  add_section(self, section);
  mark_dirty(self);
}

void simply_menu_add_item(SimplyMenu *self, SimplyMenuItem *item) {
  add_item(self, item);
  mark_dirty(self);
}

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  SimplyMenu *self = data;
  return self->num_sections;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, section_index);
  return section ? section->num_items : 1;
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuSection *section = get_menu_section(self, section_index);
  if (!section) {
    request_menu_section(self, section_index);
    return;
  }

  list1_remove(&self->sections, &section->node);
  list1_prepend(&self->sections, &section->node);

  menu_cell_basic_header_draw(ctx, cell_layer, section->title);
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuItem *item = get_menu_item(self, cell_index->section, cell_index->row);
  if (!item) {
    request_menu_item(self, cell_index->section, cell_index->row);
    return;
  }

  list1_remove(&self->items, &item->node);
  list1_prepend(&self->items, &item->node);

  menu_cell_basic_draw(ctx, cell_layer, item->title, item->subtitle, NULL);
}

static void menu_select_click_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  simply_msg_menu_select_click(cell_index->section, cell_index->row);
}

static void menu_select_long_click_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  simply_msg_menu_select_long_click(cell_index->section, cell_index->row);
}

static void window_load(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  MenuLayer *menu_layer = self->menu_layer = menu_layer_create(frame);
  Layer *menu_base_layer = menu_layer_get_layer(menu_layer);
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

static void window_unload(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  menu_layer_destroy(self->menu_layer);
  self->menu_layer = NULL;
}

void simply_menu_show(SimplyMenu *self) {
  if (!window_stack_contains_window(self->window)) {
    bool animated = true;
    window_stack_push(self->window, animated);
  }
}

SimplyMenu *simply_menu_create(void) {
  if (s_menu) {
    return s_menu;
  }

  SimplyMenu *self = malloc(sizeof(*self));
  *self = (SimplyMenu) {
    .num_sections = 1,
    .request_delay_ms = REQUEST_DELAY_MS,
  };
  s_menu = self;

  Window *window = self->window = window_create();
  window_set_user_data(window, self);
  window_set_background_color(window, GColorWhite);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });

  return self;
}

