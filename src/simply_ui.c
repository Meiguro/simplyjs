#include "simply_ui.h"

#include "simply_msg.h"

#include "simplyjs.h"

#include <pebble.h>

struct SimplyStyle {
  const char* title_font;
  const char* subtitle_font;
  const char* body_font;
  int custom_body_font_id;
  GFont custom_body_font;
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

static void click_config_provider(SimplyUi *self);

void simply_ui_set_style(SimplyUi *self, int style_index) {
  self->style = &STYLES[style_index];
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

void simply_ui_set_button(SimplyUi *self, ButtonId button, bool enable) {
  if (enable) {
    self->button_mask |= 1 << button;
  } else {
    self->button_mask &= ~(1 << button);
  }
}

static void set_text(char **str_field, const char *str) {
  free(*str_field);

  if (!str || !str[0]) {
    *str_field = NULL;
    return;
  }

  size_t size = strlen(str) + 1;
  char *buffer = malloc(size);
  strncpy(buffer, str, size);
  buffer[size - 1] = '\0';

  *str_field = buffer;
}

void simply_ui_set_text(SimplyUi *self, char **str_field, const char *str) {
  set_text(str_field, str);
  layer_mark_dirty(self->display_layer);
}

static bool is_string(const char *str) {
  return str && str[0];
}

void display_layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyUi *self = s_ui;

  GRect window_bounds = layer_get_bounds(window_get_root_layer(self->window));
  GRect bounds = layer_get_bounds(layer);

  const SimplyStyle *style = self->style;
  GFont title_font = fonts_get_system_font(style->title_font);
  GFont subtitle_font = fonts_get_system_font(style->subtitle_font);
  GFont body_font = style->custom_body_font ? style->custom_body_font : fonts_get_system_font(style->body_font);

  const int16_t x_margin = 5;
  const int16_t y_margin = 2;

  GRect text_bounds = bounds;
  text_bounds.size.w -= 2 * x_margin;
  text_bounds.size.h += 1000;
  GPoint cursor = { x_margin, y_margin };

  graphics_context_set_text_color(ctx, GColorBlack);

  bool has_title = is_string(self->title_text);
  bool has_subtitle = is_string(self->subtitle_text);
  bool has_body = is_string(self->body_text);

  GSize title_size, subtitle_size;
  GPoint title_pos, subtitle_pos;
  GRect body_rect;

  if (has_title) {
    title_size = graphics_text_layout_get_content_size(self->title_text, title_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    title_size.w = text_bounds.size.w;
    title_pos = cursor;
    cursor.y += title_size.h;
  }

  if (has_subtitle) {
    subtitle_size = graphics_text_layout_get_content_size(self->subtitle_text, title_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    subtitle_size.w = text_bounds.size.w;
    subtitle_pos = cursor;
    cursor.y += subtitle_size.h;
  }

  if (has_body) {
    body_rect = bounds;
    body_rect.origin = cursor;
    body_rect.size.w -= 2 * x_margin;
    body_rect.size.h -= 2 * y_margin + cursor.y;
    GSize body_size = graphics_text_layout_get_content_size(self->body_text, body_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    if (self->is_scrollable) {
      body_rect.size = body_size;
      int16_t new_height = cursor.y + 2 * y_margin + body_size.h;
      bounds.size.h = window_bounds.size.h > new_height ? window_bounds.size.h : new_height;
      GRect original_frame = layer_get_frame(layer);
      if (!grect_equal(&bounds, &original_frame)) {
        layer_set_frame(layer, bounds);
        scroll_layer_set_content_size(self->scroll_layer, bounds.size);
      }
    } else if (!style->custom_body_font && body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
  }

  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_fill_rect(ctx, bounds, 4, GCornersAll);

  if (has_title) {
    graphics_draw_text(ctx, self->title_text, title_font,
        (GRect) { .origin = title_pos, .size = title_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
  }

  if (has_subtitle) {
    graphics_draw_text(ctx, self->subtitle_text, subtitle_font,
        (GRect) { .origin = subtitle_pos, .size = subtitle_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
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

static void click_config_provider(SimplyUi *self) {
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

  simply_ui_set_text(self, &self->title_text, "Simply.js");
  simply_ui_set_text(self, &self->subtitle_text, "Write apps with JS!");
  simply_ui_set_text(self, &self->body_text, "Visit simplyjs.io for details.");

  simply_ui_show(self);
}

static void window_load(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  bounds.origin = GPointZero;

  ScrollLayer *scroll_layer = self->scroll_layer = scroll_layer_create(bounds);
  Layer *scroll_base_layer = scroll_layer_get_layer(scroll_layer);
  layer_add_child(window_layer, scroll_base_layer);

  Layer *display_layer = self->display_layer = layer_create(bounds);
  layer_set_update_proc(display_layer, display_layer_update_callback);
  scroll_layer_add_child(scroll_layer, display_layer);

  scroll_layer_set_context(scroll_layer, self);
  scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks) {
    .click_config_provider = (ClickConfigProvider) click_config_provider,
  });
  scroll_layer_set_click_config_onto_window(scroll_layer, window);

  simply_ui_set_style(self, 1);

  app_timer_register(10000, (AppTimerCallback) show_welcome_text, self);
}

static void window_unload(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  layer_destroy(self->display_layer);
  scroll_layer_destroy(self->scroll_layer);
  window_destroy(window);
}

void simply_ui_show(SimplyUi *self) {
  if (!window_stack_contains_window(self->window)) {
    bool animated = true;
    window_stack_push(self->window, animated);
  }
}

SimplyUi *simply_ui_create(void) {
  if (s_ui) {
    return s_ui;
  }

  for (unsigned int i = 0; i < ARRAY_LENGTH(STYLES); ++i) {
    SimplyStyle *style = &STYLES[i];
    if (style->custom_body_font_id) {
      style->custom_body_font = fonts_load_custom_font(resource_get_handle(style->custom_body_font_id));
    }
  }

  SimplyUi *self = malloc(sizeof(*self));
  *self = (SimplyUi) { .window = NULL };
  s_ui = self;

  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (i != BUTTON_ID_BACK) {
      self->button_mask |= 1 << i;
    }
  }

  Window *window = self->window = window_create();
  window_set_user_data(window, self);
  window_set_background_color(window, GColorBlack);
  window_set_click_config_provider(window, (ClickConfigProvider) click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .unload = window_unload,
  });

  window_load(self->window);

  return self;
}

void simply_ui_destroy(SimplyUi *self) {
  if (!s_ui) {
    return;
  }

  simply_ui_set_text(self, &self->title_text, NULL);
  simply_ui_set_text(self, &self->subtitle_text, NULL);
  simply_ui_set_text(self, &self->body_text, NULL);

  free(self);

  s_ui = NULL;
}
