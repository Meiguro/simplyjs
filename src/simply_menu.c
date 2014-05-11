#include "simply_menu.h"

SimplyMenu *s_menu = NULL;

static SimplyMenuSection *get_menu_section(SimplyMenu *self, int index) {
  for (SimplyMenuSection *section = self->sections; section; section = section->next) {
    if (section->index == index) {
      return section;
    }
  }
  return NULL;
}

static SimplyMenuItem *get_menu_item(SimplyMenu *self, int section, int index) {
  for (SimplyMenuItem *item = self->items; item; item = item->next) {
    if (item->section == section && item->index == index) {
      return item;
    }
  }
  return NULL;
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
  if (!section) { return; }

  menu_cell_basic_header_draw(ctx, cell_layer, section->title);
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  SimplyMenu *self = data;
  SimplyMenuItem *item = get_menu_item(self, cell_index->section, cell_index->row);
  if (!item) { return; }

  menu_cell_basic_draw(ctx, cell_layer, item->title, item->subtitle, NULL);
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {

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
    .select_click = menu_select_callback,
  });
}

static void window_unload(Window *window) {
  SimplyMenu *self = window_get_user_data(window);

  menu_layer_destroy(self->menu_layer);
  window_destroy(window);
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
  *self = (SimplyMenu) { .window = NULL };
  s_menu = self;

  Window *window = self->window = window_create();
  window_set_user_data(window, self);
  window_set_background_color(window, GColorWhite);
  window_set_window_handlers(window, (WindowHandlers) {
    .unload = window_unload,
  });

  window_load(self->window);

  return self;
}

