#include "simply_window.h"

#include "simply_msg.h"
#include "simply_res.h"
#include "simply_menu.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/graphics.h"
#include "util/scroll_layer.h"
#include "util/string.h"

#include <pebble.h>

static void click_config_provider(void *data);

static void set_scroll_layer_click_config(SimplyWindow *self) {
  if (!self->scroll_layer) {
    return;
  }

  scroll_layer_set_click_config_provider_onto_window(
      self->scroll_layer, click_config_provider, self->window, self);
}

void simply_window_set_scrollable(SimplyWindow *self, bool is_scrollable) {
  if (self->is_scrollable == is_scrollable) {
    return;
  }

  self->is_scrollable = is_scrollable;

  set_scroll_layer_click_config(self);

  if (!self->layer) {
    return;
  }

  if (!is_scrollable) {
    GRect bounds = layer_get_bounds(window_get_root_layer(self->window));
    layer_set_bounds(self->layer, bounds);
    // TODO: change back to animated when a closing animated scroll doesn't cause a crash
    const bool animated = false;
    scroll_layer_set_content_offset(self->scroll_layer, GPointZero, animated);
    scroll_layer_set_content_size(self->scroll_layer, bounds.size);
  }

  layer_mark_dirty(self->layer);
}

void simply_window_set_fullscreen(SimplyWindow *self, bool is_fullscreen) {
  if (self->is_fullscreen == is_fullscreen) {
    return;
  }

  window_set_fullscreen(self->window, is_fullscreen);

  if (!self->layer) {
    return;
  }

  GRect frame = layer_get_frame(window_get_root_layer(self->window));
  scroll_layer_set_frame(self->scroll_layer, frame);
  layer_set_frame(self->layer, frame);

  if (!window_stack_contains_window(self->window)) {
    return;
  }

  // HACK: Refresh app chrome state
  uint32_t id = self->id;
  self->id = 0;
  Window *window = window_create();
  window_stack_push(window, false);
  window_stack_remove(window, false);
  window_destroy(window);
  self->id = id;
}

void simply_window_set_background_color(SimplyWindow *self, GColor background_color) {
  self->background_color = background_color;
}

void simply_window_set_action_bar(SimplyWindow *self, bool is_action_bar) {
  self->is_action_bar = is_action_bar;

  if (!self->action_bar_layer) {
    return;
  }

  action_bar_layer_remove_from_window(self->action_bar_layer);

  set_scroll_layer_click_config(self);

  if (!is_action_bar) {
    return;
  }

  action_bar_layer_set_context(self->action_bar_layer, self);
  action_bar_layer_set_click_config_provider(self->action_bar_layer, click_config_provider);
  action_bar_layer_add_to_window(self->action_bar_layer, self->window);
}

void simply_window_set_action_bar_icon(SimplyWindow *self, ButtonId button, uint32_t id) {
  if (!self->action_bar_layer) {
    return;
  }

  if (id) {
    GBitmap *icon = simply_res_auto_image(self->simply->res, id, true);
    action_bar_layer_set_icon(self->action_bar_layer, button, icon);
    simply_window_set_action_bar(self, true);
  } else {
    action_bar_layer_clear_icon(self->action_bar_layer, button);
  }
}

void simply_window_set_action_bar_background_color(SimplyWindow *self, GColor background_color) {
  if (!self->action_bar_layer) {
    return;
  }

  action_bar_layer_set_background_color(self->action_bar_layer, background_color);
  simply_window_set_action_bar(self, true);
}

void simply_window_action_bar_clear(SimplyWindow *self) {
  simply_window_set_action_bar(self, false);

  for (ButtonId button = BUTTON_ID_UP; button <= BUTTON_ID_DOWN; ++button) {
    action_bar_layer_clear_icon(self->action_bar_layer, button);
  }
}

void simply_window_set_button(SimplyWindow *self, ButtonId button, bool enable) {
  if (enable) {
    self->button_mask |= 1 << button;
  } else {
    self->button_mask &= ~(1 << button);
  }
}

void simply_window_single_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyWindow *self = context;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (button == BUTTON_ID_BACK && !is_enabled) {
    if (simply_msg_has_communicated()) {
      simply_window_stack_back(self->simply->window_stack, self);
    } else {
      bool animated = true;
      window_stack_pop(animated);
    }
  }
  if (is_enabled) {
    simply_msg_single_click(self->simply->msg, button);
  }
}

static void long_click_handler(ClickRecognizerRef recognizer, void *context) {
  SimplyWindow *self = context;
  ButtonId button = click_recognizer_get_button_id(recognizer);
  bool is_enabled = (self->button_mask & (1 << button));
  if (is_enabled) {
    simply_msg_long_click(self->simply->msg, button);
  }
}

static void click_config_provider(void *context) {
  SimplyWindow *self = context;
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (!self->is_scrollable || (i != BUTTON_ID_UP && i != BUTTON_ID_DOWN)) {
      window_set_click_context(i, context);
      window_single_click_subscribe(i, simply_window_single_click_handler);
      window_long_click_subscribe(i, 500, (ClickHandler) long_click_handler, NULL);
    }
  }
  if (self->is_scrollable) {
    scroll_layer_click_config(self->scroll_layer);
  }
}

void simply_window_load(SimplyWindow *self) {
  Window *window = self->window;

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  ScrollLayer *scroll_layer = self->scroll_layer = scroll_layer_create(frame);
  Layer *scroll_base_layer = scroll_layer_get_layer(scroll_layer);
  layer_add_child(window_layer, scroll_base_layer);

  scroll_layer_set_context(scroll_layer, self);

  simply_window_set_action_bar(self, self->is_action_bar);
}

void simply_window_unload(SimplyWindow *self) {
  scroll_layer_destroy(self->scroll_layer);
  self->scroll_layer = NULL;
}

SimplyWindow *simply_window_init(SimplyWindow *self, Simply *simply) {
  self->simply = simply;

  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if (i != BUTTON_ID_BACK) {
      self->button_mask |= 1 << i;
    }
  }

  Window *window = self->window = window_create();
  window_set_background_color(window, GColorClear);
  window_set_click_config_provider_with_context(window, click_config_provider, self);

  ActionBarLayer *action_bar_layer = self->action_bar_layer = action_bar_layer_create();
  action_bar_layer_set_context(action_bar_layer, self);

  return self;
}

void simply_window_deinit(SimplyWindow *self) {
  if (!self) {
    return;
  }

  action_bar_layer_destroy(self->action_bar_layer);
  self->action_bar_layer = NULL;

  window_destroy(self->window);
  self->window = NULL;
}
