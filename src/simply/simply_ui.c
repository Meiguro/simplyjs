#include "simply_ui.h"

#include "simply_msg.h"
#include "simply_res.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/graphics.h"
#include "util/string.h"

#include <pebble.h>

struct SimplyStyle {
  const char* title_font;
  const char* subtitle_font;
  const char* body_font;
  int custom_body_font_id;
};

enum ClearIndex {
  ClearAction = 0,
  ClearText,
  ClearImage,
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

void simply_ui_clear(SimplyUi *self, uint32_t clear_mask) {
  if (clear_mask & (1 << ClearAction)) {
    simply_window_action_bar_clear(&self->window);
  }
  if (clear_mask & (1 << ClearText)) {
    for (SimplyUiTextfield textfield = 0; textfield < NumUiTextfields; ++textfield) {
      simply_ui_set_text(self, textfield, NULL);
    }
  }
  if (clear_mask & (1 << ClearImage)) {
    memset(self->ui_layer.imagefields, 0, sizeof(self->ui_layer.imagefields));
  }
}

void simply_ui_set_style(SimplyUi *self, int style_index) {
  if (self->ui_layer.custom_body_font) {
    fonts_unload_custom_font(self->ui_layer.custom_body_font);
    self->ui_layer.custom_body_font = NULL;
  }
  self->ui_layer.style = &STYLES[style_index];
  if (self->ui_layer.style->custom_body_font_id) {
    self->ui_layer.custom_body_font = fonts_load_custom_font(
        resource_get_handle(self->ui_layer.style->custom_body_font_id));
  }
  layer_mark_dirty(self->ui_layer.layer);
}

void simply_ui_set_text(SimplyUi *self, SimplyUiTextfield textfield, const char *str) {
  char **str_field = &self->ui_layer.textfields[textfield];
  strset(str_field, str);
  if (self->ui_layer.layer) {
    layer_mark_dirty(self->ui_layer.layer);
  }
}

static void layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyUi *self = *(void**) layer_get_data(layer);

  GRect window_frame = layer_get_frame(window_get_root_layer(self->window.window));
  GRect frame = layer_get_frame(layer);

  const SimplyStyle *style = self->ui_layer.style;
  GFont title_font = fonts_get_system_font(style->title_font);
  GFont subtitle_font = fonts_get_system_font(style->subtitle_font);
  GFont body_font = self->ui_layer.custom_body_font ? self->ui_layer.custom_body_font : fonts_get_system_font(style->body_font);

  const int16_t margin_x = 5;
  const int16_t margin_y = 2;
  const int16_t image_offset_y = 3;

  GRect text_frame = frame;
  text_frame.size.w -= 2 * margin_x;
  text_frame.size.h += 1000;
  GPoint cursor = { margin_x, margin_y };

  if (self->window.is_action_bar) {
    text_frame.size.w -= ACTION_BAR_WIDTH;
    window_frame.size.w -= ACTION_BAR_WIDTH;
  }

  graphics_context_set_text_color(ctx, GColorBlack);

  const char *title_text = self->ui_layer.textfields[UiTitle];
  const char *subtitle_text = self->ui_layer.textfields[UiSubtitle];
  const char *body_text = self->ui_layer.textfields[UiBody];

  bool has_title = is_string(title_text);
  bool has_subtitle = is_string(subtitle_text);
  bool has_body = is_string(body_text);

  GSize title_size, subtitle_size;
  GPoint title_pos, subtitle_pos, image_pos = GPointZero;
  GRect body_rect;

  GBitmap *title_icon = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiTitleIcon]);
  GBitmap *subtitle_icon = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiSubtitleIcon]);
  GBitmap *body_image = simply_res_get_image(
      self->window.simply->res, self->ui_layer.imagefields[UiBodyImage]);

  if (has_title) {
    GRect title_frame = text_frame;
    if (title_icon) {
      title_frame.origin.x += title_icon->bounds.size.w;
      title_frame.size.w -= title_icon->bounds.size.w;
    }
    title_size = graphics_text_layout_get_content_size(title_text,
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
    subtitle_size = graphics_text_layout_get_content_size(subtitle_text,
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
    GSize body_size = graphics_text_layout_get_content_size(body_text,
        body_font, text_frame, GTextOverflowModeWordWrap, GTextAlignmentLeft);
    if (self->window.is_scrollable) {
      body_rect.size = body_size;
      int16_t new_height = cursor.y + 2 * margin_y + body_size.h;
      frame.size.h = window_frame.size.h > new_height ? window_frame.size.h : new_height;
      layer_set_frame(layer, frame);
      scroll_layer_set_content_size(self->window.scroll_layer, frame.size);
    } else if (!self->ui_layer.custom_body_font && body_size.h > body_rect.size.h) {
      body_font = fonts_get_system_font(FONT_KEY_GOTHIC_18);
    }
  }

  graphics_context_set_fill_color(ctx, GColorBlack);
  graphics_fill_rect(ctx, frame, 0, GCornerNone);

  if (self->window.background_color == GColorWhite) {
    graphics_context_set_fill_color(ctx, GColorWhite);
    graphics_fill_rect(ctx, frame, 4, GCornersAll);
  }

  if (title_icon) {
    GRect icon_frame = (GRect) {
      .origin = { margin_x, title_pos.y + image_offset_y },
      .size = { title_icon->bounds.size.w, title_size.h }
    };
    graphics_draw_bitmap_centered(ctx, title_icon, icon_frame);
  }
  if (has_title) {
    graphics_draw_text(ctx, title_text, title_font,
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
    graphics_draw_text(ctx, subtitle_text, subtitle_font,
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
    graphics_draw_text(ctx, body_text, body_font, body_rect,
        GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
  }
}

static void show_welcome_text(SimplyUi *self) {
  if (simply_msg_has_communicated()) {
    return;
  }

  simply_msg_show_disconnected(self->window.simply->msg);
}

static void window_load(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  simply_window_load(&self->window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  Layer *layer = layer_create_with_data(frame, sizeof(void*));
  self->window.layer = self->ui_layer.layer = layer;
  *(void**) layer_get_data(layer) = self;
  layer_set_update_proc(layer, layer_update_callback);
  scroll_layer_add_child(self->window.scroll_layer, layer);
  scroll_layer_set_click_config_onto_window(self->window.scroll_layer, window);

  simply_ui_set_style(self, 1);
}

static void window_appear(Window *window) {
  SimplyUi *self = window_get_user_data(window);
  simply_window_stack_send_show(self->window.simply->window_stack, &self->window);
}

static void window_disappear(Window *window) {
  SimplyUi *self = window_get_user_data(window);
  simply_window_stack_send_hide(self->window.simply->window_stack, &self->window);
}

static void window_unload(Window *window) {
  SimplyUi *self = window_get_user_data(window);

  layer_destroy(self->ui_layer.layer);
  self->window.layer = self->ui_layer.layer = NULL;

  simply_window_unload(&self->window);
}

SimplyUi *simply_ui_create(Simply *simply) {
  SimplyUi *self = malloc(sizeof(*self));
  *self = (SimplyUi) { .window.layer = NULL };

  simply_window_init(&self->window, simply);
  simply_window_set_background_color(&self->window, GColorWhite);

  window_set_user_data(self->window.window, self);
  window_set_window_handlers(self->window.window, (WindowHandlers) {
    .load = window_load,
    .appear = window_appear,
    .disappear = window_disappear,
    .unload = window_unload,
  });

  app_timer_register(10000, (AppTimerCallback) show_welcome_text, self);

  return self;
}

void simply_ui_destroy(SimplyUi *self) {
  if (!self) {
    return;
  }

  simply_ui_clear(self, ~0);

  fonts_unload_custom_font(self->ui_layer.custom_body_font);
  self->ui_layer.custom_body_font = NULL;

  simply_window_deinit(&self->window);

  free(self);
}
