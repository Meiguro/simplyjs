#include "simply_ui.h"

#include "simply_msg.h"

#include "simply-js.h"

#include <pebble.h>

struct SimplyStyle {
  const char* title_font;
  const char* subtitle_font;
  const char* body_font;
};

static const SimplyStyle STYLES[] = {
  {
    .title_font = FONT_KEY_GOTHIC_24_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_18_BOLD,
    .body_font = FONT_KEY_GOTHIC_18,
  },
  {
    .title_font = FONT_KEY_GOTHIC_28_BOLD,
    .subtitle_font = FONT_KEY_GOTHIC_28,
    .body_font = FONT_KEY_GOTHIC_24_BOLD,
  }
};

// FIXME: all service need to support a user context
SimplyData *s_data = NULL;

void simply_set_style(SimplyData* simply, int style_index) {
  simply->style = &STYLES[style_index];
  layer_mark_dirty(simply->display_layer);
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

void simply_set_text(SimplyData* simply, char **str_field, const char *str) {
  set_text(str_field, str);
  layer_mark_dirty(simply->display_layer);
}

static bool is_string(const char* str) {
  return str && str[0];
}
void display_layer_update_callback(Layer *layer, GContext* ctx) {
  SimplyData *data = s_data;

  GRect bounds = layer_get_bounds(layer);

  const SimplyStyle *style = data->style;
  GFont title_font = fonts_get_system_font(style->title_font);
  GFont subtitle_font = fonts_get_system_font(style->subtitle_font);
  GFont body_font = fonts_get_system_font(style->body_font);

  const int16_t x_margin = 5;
  const int16_t y_margin = 2;

  GRect text_bounds = bounds;
  text_bounds.size.w -= 2 * x_margin;
  text_bounds.size.h += 1000;
  GPoint cursor = { x_margin, y_margin };

  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_fill_rect(ctx, bounds, 4, GCornersAll);

  graphics_context_set_text_color(ctx, GColorBlack);

  if (is_string(data->title_text)) {
    GSize title_size = graphics_text_layout_get_content_size(data->title_text, title_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    title_size.w = text_bounds.size.w;
    graphics_draw_text(ctx, data->title_text, title_font,
        (GRect) { .origin = cursor, .size = title_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
    cursor.y += title_size.h;
  }

  if (is_string(data->subtitle_text)) {
    GSize subtitle_size = graphics_text_layout_get_content_size(data->subtitle_text, title_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    subtitle_size.w = text_bounds.size.w;
    graphics_draw_text(ctx, data->subtitle_text, subtitle_font,
        (GRect) { .origin = cursor, .size = subtitle_size },
        GTextOverflowModeWordWrap, GTextAlignmentLeft, NULL);
    cursor.y += subtitle_size.h;
  }

  if (is_string(data->body_text)) {
    GRect body_rect = bounds;
    body_rect.origin = cursor;
    body_rect.size.w -= 2 * x_margin;
    body_rect.size.h -= 2 * y_margin + cursor.y;
    GSize body_size = graphics_text_layout_get_content_size(data->body_text, body_font, text_bounds,
        GTextOverflowModeWordWrap, GTextAlignmentLeft);
    if (body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
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
static void click_config_provider(void *context) {
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    window_single_click_subscribe(i, (ClickHandler) single_click_handler);
    window_long_click_subscribe(i, 500, (ClickHandler) long_click_handler, NULL);
  }
}

static void window_load(Window *window) {
  SimplyData *data = window_get_user_data(window);

  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  bounds.origin = GPointZero;

  data->display_layer = layer_create(bounds);
  layer_set_update_proc(data->display_layer, display_layer_update_callback);
  layer_add_child(window_layer, data->display_layer);

  simply_set_style(data, 1);

  simply_set_text(data, &data->title_text, "Simply.js 1");
  simply_set_text(data, &data->subtitle_text, "Welcome");
  simply_set_text(data, &data->body_text, "Simply.js allows you to push interactive text to your Pebble with just JavaScript!");
}

static void window_unload(Window *window) {
  SimplyData *data = window_get_user_data(window);

  layer_destroy(data->display_layer);
}

static void handle_accel_tap(AccelAxisType axis, int32_t direction) {
  simply_msg_accel_tap(axis, direction);
}

SimplyData *simply_create(void) {
  if (s_data) {
    return s_data;
  }

  SimplyData *data = malloc(sizeof(struct SimplyData));
  *data = (SimplyData) { .window = NULL };
  s_data = data;

  Window *window = data->window = window_create();
  window_set_user_data(window, data);
  window_set_background_color(window, GColorBlack);
  window_set_click_config_provider(window, click_config_provider);
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

  accel_tap_service_unsubscribe();

  //window_destroy(data->window);
  free(data);

  s_data = NULL;
}
