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

SimplyData *s_data = NULL;

void simply_set_style(SimplyData *simply, int style_index) {
  simply->style = &STYLES[style_index];
  layer_mark_dirty(simply->display_layer);
}

void simply_set_scrollable(SimplyData *simply, bool is_scrollable) {
  simply->is_scrollable = is_scrollable;
  scroll_layer_set_click_config_onto_window(simply->scroll_layer, simply->window);

  if (!is_scrollable) {
    GRect bounds = layer_get_bounds(window_get_root_layer(simply->window));
    layer_set_bounds(simply->display_layer, bounds);
    const bool animated = true;
    scroll_layer_set_content_offset(simply->scroll_layer, GPointZero, animated);
    scroll_layer_set_content_size(simply->scroll_layer, bounds.size);
  }

  layer_mark_dirty(simply->display_layer);
}

void simply_set_fullscreen(SimplyData *simply, bool is_fullscreen) {
  window_set_fullscreen(simply->window, is_fullscreen);

  GRect frame = layer_get_frame(window_get_root_layer(simply->window));
  scroll_layer_set_frame(simply->scroll_layer, frame);
  layer_set_frame(simply->display_layer, frame);

  // HACK: Refresh app chrome state
  Window *window = window_create();
  window_stack_push(window, false);
  window_stack_remove(window, false);
  window_destroy(window);
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

void simply_set_text(SimplyData *simply, char **str_field, const char *str) {
  set_text(str_field, str);
  layer_mark_dirty(simply->display_layer);
}

static bool is_string(const char *str) {
  return str && str[0];
}
void display_layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyData *data = s_data;

  GRect window_bounds = layer_get_bounds(window_get_root_layer(data->window));
  GRect bounds = layer_get_bounds(layer);

  const SimplyStyle *style = data->style;
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

  bool has_title = is_string(data->title_text);
  bool has_subtitle = is_string(data->subtitle_text);
  bool has_body = is_string(data->body_text);

  GSize title_size, subtitle_size;
  GPoint title_pos, subtitle_pos;
  GRect body_rect;

  if (has_title) {
    title_size = graphics_text_layout_get_content_size(data->title_text, title_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    title_size.w = text_bounds.size.w;
    title_pos = cursor;
    cursor.y += title_size.h;
  }

  if (has_subtitle) {
    subtitle_size = graphics_text_layout_get_content_size(data->subtitle_text, title_font, text_bounds,
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
    GSize body_size = graphics_text_layout_get_content_size(data->body_text, body_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    if (data->is_scrollable) {
      body_rect.size = body_size;
      int16_t new_height = cursor.y + 2 * y_margin + body_size.h;
      bounds.size.h = window_bounds.size.h > new_height ? window_bounds.size.h : new_height;
      layer_set_frame(layer, bounds);
      scroll_layer_set_content_size(data->scroll_layer, bounds.size);
    } else if (!style->custom_body_font && body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
  }

  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_fill_rect(ctx, bounds, 4, GCornersAll);

  if (has_title) {
    graphics_draw_text(ctx, data->title_text, title_font,
        (GRect) { .origin = title_pos, .size = title_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
  }

  if (has_subtitle) {
    graphics_draw_text(ctx, data->subtitle_text, subtitle_font,
        (GRect) { .origin = subtitle_pos, .size = subtitle_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
  }

  if (has_body) {
    graphics_draw_text(ctx, data->body_text, body_font, body_rect,
        GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
  }
}

static void single_click_handler(ClickRecognizerRef recognizer, void *context) {
  simply_msg_single_click(click_recognizer_get_button_id(recognizer));
}

static void long_click_handler(ClickRecognizerRef recognizer, void *context) {
  simply_msg_long_click(click_recognizer_get_button_id(recognizer));
}

static void click_config_provider(SimplyData *data) {
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (i == BUTTON_ID_BACK) {
      continue;
    }
    if (!data->is_scrollable || (i != BUTTON_ID_UP && i != BUTTON_ID_DOWN)) {
      window_single_click_subscribe(i, (ClickHandler) single_click_handler);
      window_long_click_subscribe(i, 500, (ClickHandler) long_click_handler, NULL);
    }
  }
}

static void show_welcome_text(SimplyData *data) {
  if (data->title_text || data->subtitle_text || data->body_text) {
    return;
  }

  simply_set_text(data, &data->title_text, "Simply.js");
  simply_set_text(data, &data->subtitle_text, "Welcome");
  simply_set_text(data, &data->body_text, "Simply.js allows you to push interactive text to your Pebble with just JavaScript!");
}

static void window_load(Window *window) {
  SimplyData *data = window_get_user_data(window);

  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  bounds.origin = GPointZero;

  ScrollLayer *scroll_layer = data->scroll_layer = scroll_layer_create(bounds);
  Layer *scroll_base_layer = scroll_layer_get_layer(scroll_layer);
  layer_add_child(window_layer, scroll_base_layer);

  Layer *display_layer = data->display_layer = layer_create(bounds);
  layer_set_update_proc(display_layer, display_layer_update_callback);
  scroll_layer_add_child(scroll_layer, display_layer);

  scroll_layer_set_context(scroll_layer, data);
  scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks) {
    .click_config_provider = (ClickConfigProvider) click_config_provider,
  });
  scroll_layer_set_click_config_onto_window(scroll_layer, window);

  simply_set_style(data, 1);

  app_timer_register(1000, (AppTimerCallback) show_welcome_text, data);
}

static void window_unload(Window *window) {
  SimplyData *data = window_get_user_data(window);

  layer_destroy(data->display_layer);
  scroll_layer_destroy(data->scroll_layer);
  window_destroy(window);
}

static void handle_accel_tap(AccelAxisType axis, int32_t direction) {
  simply_msg_accel_tap(axis, direction);
}

SimplyData *simply_create(void) {
  if (s_data) {
    return s_data;
  }

  for (unsigned int i = 0; i < ARRAY_LENGTH(STYLES); ++i) {
    SimplyStyle *style = &STYLES[i];
    if (style->custom_body_font_id) {
      style->custom_body_font = fonts_load_custom_font(resource_get_handle(style->custom_body_font_id));
    }
  }

  SimplyData *data = malloc(sizeof(struct SimplyData));
  *data = (SimplyData) { .window = NULL };
  s_data = data;

  Window *window = data->window = window_create();
  window_set_user_data(window, data);
  window_set_background_color(window, GColorBlack);
  window_set_click_config_provider(window, (ClickConfigProvider) click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });

  const bool animated = true;
  window_stack_push(window, animated);

  accel_tap_service_subscribe(handle_accel_tap);

  return data;
}

void simply_destroy(SimplyData *data) {
  if (!s_data) {
    return;
  }

  simply_set_text(data, &data->title_text, NULL);
  simply_set_text(data, &data->subtitle_text, NULL);
  simply_set_text(data, &data->body_text, NULL);

  accel_tap_service_unsubscribe();

  free(data);

  s_data = NULL;
}
