#include "simply_ui.h"

#include "simply_msg.h"
#include "simply_res.h"
#include "simply_menu.h"

#include "simplyjs.h"

#include "util/graphics.h"
#include "util/string.h"

#include <pebble.h>

struct SimplyStyle {
  const char* title_font;
  const char* subtitle_font;
  const char* body_font;
  int custom_body_font_id;
};

static SimplyStyle STYLES[] = {
  {
    .title_font = FONT_KEY_GOTHIC_24_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_18_BOLD,
    .body_font = FONT_KEY_GOTHIC_18,
  },
  {
    .title_font = FONT_KEY_GOTHIC_28_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_28,
    .body_font = FONT_KEY_GOTHIC_24_BOLD,
  },
  {
    .title_font = FONT_KEY_GOTHIC_24_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_18_BOLD,
    .custom_body_font_id = RESOURCE_ID_MONO_FONT_14,
  },
};

SimplyUi *s_ui = NULL;

static void click_config_provider(void *data);

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask) {
  if (clear_mask & (1 << 0)) {
    simply_ui_set_text(self, &self->title_text, NULL);
    simply_ui_set_text(self, &self->subtitle_text, NULL);
    simply_ui_set_text(self, &self->body_text, NULL);
  }
  if (clear_mask & (1 << 1)) {
    self->title_icon = 0;
    self->subtitle_icon = 0;
    self->image = 0;
  }
  if (clear_mask & (1 << 2)) {
    simply_ui_set_action_bar(self, false);
    for (ButtonId button = BUTTON_ID_UP; button <= BUTTON_ID_DOWN; ++button) {
      action_bar_layer_clear_icon(self->action_bar_layer, button);
    }
  }
}

void simply_ui_set_style(SimplyUi *self, int style_index) {
  if (self->custom_body_font) {
    fonts_unload_custom_font(self->custom_body_font);
    self->custom_body_font = NULL;
  }
  self->style = &STYLES[style_index];
  if (self->style->custom_body_font_id) {
    self->custom_body_font = fonts_load_custom_font(self->custom_body_font);
  }
  layer_mark_dirty(self->display_layer);
}

void simply_ui_set_scrollable(SimplyUi *self, bool is_scrollable) {
  self->is_scrollable = is_scrollable;
  scroll_layer_set_click_config_onto_window(self->scroll_layer, self->window);

  if (!is_scrollable) {
    GRect bounds = layer_get_bounds(window_get_root_layer(self->window));
    layer_set_bounds(self->display_layer, bounds);
    const bool animated = true;
    scroll_layer_set_content_offset(self->scroll_layer, GPointZero, animated);
    scroll_layer_set_content_size(self->scroll_layer, bounds.size);
  }

  layer_mark_dirty(self->display_layer);
}

void simply_ui_set_fullscreen(SimplyUi *self, bool is_fullscreen) {
  window_set_fullscreen(self->window, is_fullscreen);

  if (!self->display_layer) {
    return;
  }

  GRect frame = layer_get_frame(window_get_root_layer(self->window));
  scroll_layer_set_frame(self->scroll_layer, frame);
  layer_set_frame(self->display_layer, frame);

  if (!window_stack_contains_window(self->window)) {
    return;
  }

  // HACK: Refresh app chrome state
  Window *window = window_create();
  window_stack_push(window, false);
  window_stack_remove(window, false);
  window_destroy(window);
}

void simply_ui_set_action_bar(SimplyUi *self, bool is_action_bar) {
  self->is_action_bar = is_action_bar;
  action_bar_layer_remove_from_window(self->action_bar_layer);
  if (is_action_bar) {
    action_bar_layer_add_to_window(self->action_bar_layer, self->window);
    action_bar_layer_set_click_config_provider(self->action_bar_layer, click_config_provider);
  } else {
    window_set_click_config_provider(self->window, click_config_provider);
  }
}

void simply_ui_set_action_bar_icon(SimplyUi *self, ButtonId button, uint32_t id) {
  if (id) {
    GBitmap *icon = simply_res_auto_image(self->simply->res, id, true);
    action_bar_layer_set_icon(self->action_bar_layer, button, icon);
    simply_ui_set_action_bar(self, true);
  } else {
    action_bar_layer_clear_icon(self->action_bar_layer, button);
  }
}

void simply_ui_set_button(SimplyUi *self, ButtonId button, bool enable) {
  if (enable) {
    self->button_mask |= 1 << button;
  } else {
    self->button_mask &= ~(1 << button);
  }
}

static void set_text(char **str_field, const char *str) {
  free(*str_field);

  if (!is_string(str)) {
    *str_field = NULL;
    return;
  }

  *str_field = strdup2(str);
}

void simply_ui_set_text(SimplyUi *self, char **str_field, const char *str) {
  set_text(str_field, str);
  if (self->display_layer) {
    layer_mark_dirty(self->display_layer);
  }
}

void display_layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyUi *self = s_ui;

  GRect window_frame = layer_get_frame(window_get_root_layer(self->window));
  GRect frame = layer_get_frame(layer);

  const SimplyStyle *style = self->style;
  GFont title_font = fonts_get_system_font(style->title_font);
  GFont subtitle_font = fonts_get_system_font(style->subtitle_font);
  GFont body_font = self->custom_body_font ? self->custom_body_font : fonts_get_system_font(style->body_font);

  const int16_t margin_x = 5;
  const int16_t margin_y = 2;
  const int16_t image_offset_y = 3;

  GRect text_frame = frame;
  text_frame.size.w -= 2 * margin_x;
  text_frame.size.h += 1000;
  GPoint cursor = { margin_x, margin_y };

  if (self->is_action_bar) {
    text_frame.size.w -= ACTION_BAR_WIDTH;
    window_frame.size.w -= ACTION_BAR_WIDTH;
  }

  graphics_context_set_text_color(ctx, GColorBlack);

  bool has_title = is_string(self->title_text);
  bool has_subtitle = is_string(self->subtitle_text);
  bool has_body = is_string(self->body_text);

  GSize title_size, subtitle_size;
  GPoint title_pos, subtitle_pos, image_pos = GPointZero;
  GRect body_rect;

  GBitmap *title_icon = simply_res_get_image(self->simply->res, self->title_icon);
  GBitmap *subtitle_icon = simply_res_get_image(self->simply->res, self->subtitle_icon);
  GBitmap *body_image = simply_res_get_image(self->simply->res, self->image);

  if (has_title) {
    GRect title_frame = text_frame;
    if (title_icon) {
      title_frame.origin.x += title_icon->bounds.size.w;
      title_frame.size.w -= title_icon->bounds.size.w;
    }
    title_size = graphics_text_layout_get_content_size(self->title_text,
        title_font, title_frame, GTextOverflowModeWordWrap, GTextAlignmentLeft);
    title_size.w = title_frame.size.w;
    title_pos = cursor;
    if (title_icon) {
      title_pos.x += title_icon->bounds.size.w;
    }
    cursor.y += title_size.h;
  }

  if (has_subtitle) {
    GRect subtitle_frame = text_frame;
    if (subtitle_icon) {
      subtitle_frame.origin.x += subtitle_icon->bounds.size.w;
      subtitle_frame.size.w -= subtitle_icon->bounds.size.w;
    }
    subtitle_size = graphics_text_layout_get_content_size(self->subtitle_text,
        title_font, subtitle_frame, GTextOverflowModeWordWrap, GTextAlignmentLeft);
    subtitle_size.w = subtitle_frame.size.w;
    subtitle_pos = cursor;
    if (subtitle_icon) {
      subtitle_pos.x += subtitle_icon->bounds.size.w;
    }
    cursor.y += subtitle_size.h;
  }

  if (body_image) {
    image_pos = cursor;
    cursor.y += body_image->bounds.size.h;
  }

  if (has_body) {
    body_rect = frame;
    body_rect.origin = cursor;
    body_rect.size.w = text_frame.size.w;
    body_rect.size.h -= 2 * margin_y + cursor.y;
    GSize body_size = graphics_text_layout_get_content_size(self->body_text,
        body_font, text_frame, GTextOverflowModeWordWrap, GTextAlignmentLeft);
    if (self->is_scrollable) {
      body_rect.size = body_size;
      int16_t new_height = cursor.y + 2 * margin_y + body_size.h;
      frame.size.h = window_frame.size.h > new_height ? window_frame.size.h : new_height;
      layer_set_frame(layer, frame);
      scroll_layer_set_content_size(self->scroll_layer, frame.size);
    } else if (!self->custom_body_font && body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
  }

  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_fill_rect(ctx, frame, 4, GCornersAll);

  if (title_icon) {
    GRect icon_frame = (GRect) {
      .origin = { margin_x, title_pos.y + image_offset_y },
      .size = { title_icon->bounds.size.w, title_size.h }
    };
    graphics_draw_bitmap_centered(ctx, title_icon, icon_frame);
  }
  if (has_title) {
    graphics_draw_text(ctx, self->title_text, title_font,
        (GRect) { .origin = title_pos, .size = title_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
  }

  if (subtitle_icon) {
    GRect subicon_frame = (GRect) {
      .origin = { margin_x, subtitle_pos.y + image_offset_y },
      .size = { subtitle_icon->bounds.size.w, subtitle_size.h }
    };
    graphics_draw_bitmap_centered(ctx, subtitle_icon, subicon_frame);
  }
  if (has_subtitle) {
    graphics_draw_text(ctx, self->subtitle_text, subtitle_font,
        (GRect) { .origin = subtitle_pos, .size = subtitle_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
  }

  if (body_image) {
    GRect image_frame = (GRect) {
      .origin = { 0, image_pos.y + image_offset_y },
      .size = { window_frame.size.w, body_image->bounds.size.h }
    };
    graphics_draw_bitmap_centered(ctx, body_image, image_frame);
  }
  if (has_body) {
    graphics_draw_text(ctx, self->body_text, body_font, body_rect,
        GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
  }
}

static void single_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyUi *self = s_ui;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (button == BUTTON_ID_BACK && !is_enabled) {
    bool animated = true;
    window_stack_pop(animated);
  }
  if (is_enabled) {
    simply_msg_single_click(button);
  }
}

static void long_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyUi *self = s_ui;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (is_enabled) {
    simply_msg_long_click(button);
  }
}

static void click_config_provider(void *data) {
  SimplyUi *self = data;
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (!self->is_scrollable || (i != BUTTON_ID_UP && i != BUTTON_ID_DOWN)) {
      window_single_click_subscribe(i, (ClickHandler) single_click_handler);
      window_long_click_subscribe(i, 500, (ClickHandler) long_click_handler, NULL);
    }
  }
}

static void show_welcome_text(SimplyUi *self) {
  if (self->title_text || self->subtitle_text || self->body_text) {
    return;
  }
  if (self->simply->menu->menu_layer) {
    return;
  }

  simply_ui_set_text(self, &self->title_text, "Simply.js");
  simply_ui_set_text(self, &self->subtitle_text, "Write apps with JS!");
  simply_ui_set_text(self, &self->body_text, "Visit simplyjs.io for details.");

  simply_ui_show(self);
}

static void window_load(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  ScrollLayer *scroll_layer = self->scroll_layer = scroll_layer_create(frame);
  Layer *scroll_base_layer = scroll_layer_get_layer(scroll_layer);
  layer_add_child(window_layer, scroll_base_layer);

  Layer *display_layer = self->display_layer = layer_create(frame);
  layer_set_update_proc(display_layer, display_layer_update_callback);
  scroll_layer_add_child(scroll_layer, display_layer);

  scroll_layer_set_context(scroll_layer, self);
  scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks) {
    .click_config_provider = click_config_provider,
  });
  scroll_layer_set_click_config_onto_window(scroll_layer, window);

  if (self->is_action_bar) {
    simply_ui_set_action_bar(self, true);
  }

  simply_ui_set_style(self, 1);
}

static void window_unload(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  layer_destroy(self->display_layer);
  self->display_layer = NULL;
  scroll_layer_destroy(self->scroll_layer);
  self->scroll_layer = NULL;
}

static void window_disappear(Window *window) {
  simply_msg_ui_exit();
}

void simply_ui_show(SimplyUi *self) {
  if (!self->window) {
    return;
  }
  if (!window_stack_contains_window(self->window)) {
    bool animated = true;
    window_stack_push(self->window, animated);
  }
}

SimplyUi *simply_ui_create(Simply *simply) {
  if (s_ui) {
    return s_ui;
  }

  SimplyUi *self = malloc(sizeof(*self));
  *self = (SimplyUi) { .simply = simply };
  s_ui = self;

  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (i != BUTTON_ID_BACK) {
      self->button_mask |= 1 << i;
    }
  }

  Window *window = self->window = window_create();
  window_set_user_data(window, self);
  window_set_background_color(window, GColorBlack);
  window_set_click_config_provider(window, click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .disappear = window_disappear,
    .unload = window_unload,
  });

  ActionBarLayer *action_bar_layer = self->action_bar_layer = action_bar_layer_create();
  action_bar_layer_set_context(action_bar_layer, self);

  app_timer_register(10000, (AppTimerCallback) show_welcome_text, self);

  return self;
}

void simply_ui_destroy(SimplyUi *self) {
  if (!self) {
    return;
  }

  action_bar_layer_destroy(self->action_bar_layer);
  self->action_bar_layer = NULL;

  window_destroy(self->window);
  self->window = NULL;

  simply_ui_set_text(self, &self->title_text, NULL);
  simply_ui_set_text(self, &self->subtitle_text, NULL);
  simply_ui_set_text(self, &self->body_text, NULL);

  fonts_unload_custom_font(self->custom_body_font);
  self->custom_body_font = NULL;

  free(self);

  s_ui = NULL;
}
