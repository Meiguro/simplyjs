#include "simply_stage.h"

#include "simply_window.h"
#include "simply_res.h"
#include "simply_msg.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/graphics.h"
#include "util/memory.h"
#include "util/string.h"
#include "util/window.h"

#include <pebble.h>

static bool id_filter(List1Node *node, void *data) {
  return (((SimplyElementCommon*) node)->id == (uint32_t)(uintptr_t) data);
}

static bool animation_filter(List1Node *node, void *data) {
  return (((SimplyAnimation*) node)->animation == (PropertyAnimation*) data);
}

static bool animation_element_filter(List1Node *node, void *data) {
  return (((SimplyAnimation*) node)->element == (SimplyElementCommon*) data);
}

static void destroy_element(SimplyStage *self, SimplyElementCommon *element) {
  if (!element) { return; }
  list1_remove(&self->stage_layer.elements, &element->node);
  switch (element->type) {
    default: break;
    case SimplyElementTypeText:
      free(((SimplyElementText*) element)->text);
      break;
    case SimplyElementTypeInverter:
      inverter_layer_destroy(((SimplyElementInverter*) element)->inverter_layer);
      break;
  }
  free(element);
}

static void destroy_animation(SimplyStage *self, SimplyAnimation *animation) {
  if (!animation) { return; }
  list1_remove(&self->stage_layer.animations, &animation->node);
  free(animation);
}

void simply_stage_clear(SimplyStage *self) {
  simply_window_action_bar_clear(&self->window);

  while (self->stage_layer.elements) {
    destroy_element(self, (SimplyElementCommon*) self->stage_layer.elements);
  }

  while (self->stage_layer.animations) {
    destroy_animation(self, (SimplyAnimation*) self->stage_layer.animations);
  }

  simply_stage_update_ticker(self);
}

static void rect_element_draw_background(GContext *ctx, SimplyStage *self, SimplyElementRect *element) {
  if (element->background_color != GColorClear) {
    graphics_context_set_fill_color(ctx, element->background_color);
    graphics_fill_rect(ctx, element->frame, element->radius, GCornersAll);
  }
}

static void rect_element_draw_border(GContext *ctx, SimplyStage *self, SimplyElementRect *element) {
  if (element->border_color != GColorClear) {
    graphics_context_set_stroke_color(ctx, element->border_color);
    graphics_draw_round_rect(ctx, element->frame, element->radius);
  }
}

static void rect_element_draw(GContext *ctx, SimplyStage *self, SimplyElementRect *element) {
  rect_element_draw_background(ctx, self, element);
  rect_element_draw_border(ctx, self, element);
}

static void circle_element_draw(GContext *ctx, SimplyStage *self, SimplyElementCircle *element) {
  if (element->background_color != GColorClear) {
    graphics_context_set_fill_color(ctx, element->background_color);
    graphics_fill_circle(ctx, element->frame.origin, element->radius);
  }
  if (element->border_color != GColorClear) {
    graphics_context_set_stroke_color(ctx, element->border_color);
    graphics_draw_circle(ctx, element->frame.origin, element->radius);
  }
}

static char *format_time(char *format) {
  time_t now = time(NULL);
  struct tm* tm = localtime(&now);
  static char time_text[256];
  strftime(time_text, sizeof(time_text), format, tm);
  return time_text;
}

static void text_element_draw(GContext *ctx, SimplyStage *self, SimplyElementText *element) {
  rect_element_draw(ctx, self, (SimplyElementRect*) element);
  char *text = element->text;
  if (element->text_color != GColorClear && is_string(text)) {
    if (element->time_units) {
      text = format_time(text);
    }
    GFont font = element->font ? element->font : fonts_get_system_font(FONT_KEY_GOTHIC_14);
    graphics_context_set_text_color(ctx, element->text_color);
    graphics_draw_text(ctx, text, font, element->frame, element->overflow_mode, element->alignment, NULL);
  }
}

static void image_element_draw(GContext *ctx, SimplyStage *self, SimplyElementImage *element) {
  graphics_context_set_compositing_mode(ctx, element->compositing);
  rect_element_draw_background(ctx, self, (SimplyElementRect*) element);
  GBitmap *bitmap = simply_res_get_image(self->window.simply->res, element->image);
  if (bitmap) {
    GRect frame = element->frame;
    if (frame.size.w == 0 && frame.size.h == 0) {
      frame = bitmap->bounds;
    }
    graphics_draw_bitmap_centered(ctx, bitmap, frame);
  }
  rect_element_draw_border(ctx, self, (SimplyElementRect*) element);
  graphics_context_set_compositing_mode(ctx, GCompOpAssign);
}

static void layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyStage *self = *(void**) layer_get_data(layer);

  GRect frame = layer_get_frame(layer);
  frame.origin = scroll_layer_get_content_offset(self->window.scroll_layer);
  frame.origin.x = -frame.origin.x;
  frame.origin.y = -frame.origin.y;

  graphics_context_set_fill_color(ctx, self->window.background_color);
  graphics_fill_rect(ctx, frame, 0, GCornerNone);

  SimplyElementCommon *element = (SimplyElementCommon*) self->stage_layer.elements;
  while (element) {
    int16_t max_y = element->frame.origin.y + element->frame.size.h;
    if (max_y > frame.size.h) {
      frame.size.h = max_y;
    }
    switch (element->type) {
      case SimplyElementTypeNone:
        break;
      case SimplyElementTypeRect:
        rect_element_draw(ctx, self, (SimplyElementRect*) element);
        break;
      case SimplyElementTypeCircle:
        circle_element_draw(ctx, self, (SimplyElementCircle*) element);
        break;
      case SimplyElementTypeText:
        text_element_draw(ctx, self, (SimplyElementText*) element);
        break;
      case SimplyElementTypeImage:
        image_element_draw(ctx, self, (SimplyElementImage*) element);
        break;
      case SimplyElementTypeInverter:
        break;
    }
    element = (SimplyElementCommon*) element->node.next;
  }

  if (self->window.is_scrollable) {
    frame.origin = GPointZero;
    layer_set_frame(layer, frame);
    scroll_layer_set_content_size(self->window.scroll_layer, frame.size);
  }
}

static SimplyElementCommon *alloc_element(SimplyElementType type) {
  switch (type) {
    case SimplyElementTypeNone: return NULL;
    case SimplyElementTypeRect: return malloc0(sizeof(SimplyElementRect));
    case SimplyElementTypeCircle: return malloc0(sizeof(SimplyElementCircle));
    case SimplyElementTypeText: return malloc0(sizeof(SimplyElementText));
    case SimplyElementTypeImage: return malloc0(sizeof(SimplyElementImage));
    case SimplyElementTypeInverter: {
      SimplyElementInverter *element = malloc0(sizeof(SimplyElementInverter));
      element->inverter_layer = inverter_layer_create(GRect(0, 0, 0, 0));
      return &element->common;
    }
  }
  return NULL;
}

SimplyElementCommon *simply_stage_auto_element(SimplyStage *self, uint32_t id, SimplyElementType type) {
  if (!id) {
    return NULL;
  }
  SimplyElementCommon *element = (SimplyElementCommon*) list1_find(
      self->stage_layer.elements, id_filter, (void*)(uintptr_t) id);
  if (element) {
    return element;
  }
  element = alloc_element(type);
  if (!element) {
    return NULL;
  }
  element->id = id;
  element->type = type;
  return element;
}

SimplyElementCommon *simply_stage_insert_element(SimplyStage *self, int index, SimplyElementCommon *element) {
  simply_stage_remove_element(self, element);
  switch (element->type) {
    default: break;
    case SimplyElementTypeInverter:
      layer_add_child(self->stage_layer.layer,
          inverter_layer_get_layer(((SimplyElementInverter*) element)->inverter_layer));
      break;
  }
  return (SimplyElementCommon*) list1_insert(&self->stage_layer.elements, index, &element->node);
}

SimplyElementCommon *simply_stage_remove_element(SimplyStage *self, SimplyElementCommon *element) {
  switch (element->type) {
    default: break;
    case SimplyElementTypeInverter:
      layer_remove_from_parent(inverter_layer_get_layer(((SimplyElementInverter*) element)->inverter_layer));
      break;
  }
  return (SimplyElementCommon*) list1_remove(&self->stage_layer.elements, &element->node);
}

void simply_stage_set_element_frame(SimplyStage *self, SimplyElementCommon *element, GRect frame) {
  element->frame = frame;
  switch (element->type) {
    default: break;
    case SimplyElementTypeInverter: {
      Layer *layer = inverter_layer_get_layer(((SimplyElementInverter*) element)->inverter_layer);
      layer_set_frame(layer, element->frame);
      break;
    }
  }
}

static void element_frame_setter(void *subject, GRect frame) {
  SimplyAnimation *animation = subject;
  simply_stage_set_element_frame(animation->stage, animation->element, frame);
  simply_stage_update(animation->stage);
}

static GRect element_frame_getter(void *subject) {
  SimplyAnimation *animation = subject;
  return animation->element->frame;
}

static void animation_stopped(Animation *base_animation, bool finished, void *context) {
  SimplyStage *self = context;
  SimplyAnimation *animation = (SimplyAnimation*) list1_find(
      self->stage_layer.animations, animation_filter, base_animation);
  if (!animation) {
    return;
  }
  SimplyElementCommon *element = animation->element;
  destroy_animation(self, animation);
  simply_msg_animate_element_done(self->window.simply->msg, element->id);
}

SimplyAnimation *simply_stage_animate_element(SimplyStage *self,
    SimplyElementCommon *element, SimplyAnimation* animation, GRect to_frame) {
  if (!animation) {
    return NULL;
  }
  SimplyAnimation *prev_animation = (SimplyAnimation*) list1_find(
      self->stage_layer.animations, animation_element_filter, element);
  if (prev_animation) {
    animation_unschedule((Animation*) prev_animation->animation);
  }

  animation->stage = self;
  animation->element = element;

  static const PropertyAnimationImplementation implementation = {
    .base = {
      .update = (AnimationUpdateImplementation) property_animation_update_grect,
      .teardown = (AnimationTeardownImplementation) free,
    },
    .accessors = {
      .setter = { .grect = (const GRectSetter) element_frame_setter },
      .getter = { .grect = (const GRectGetter) element_frame_getter },
    },
  };

  PropertyAnimation *property_animation = property_animation_create(&implementation, animation, NULL, NULL);
  if (!property_animation) {
    free(animation);
    return NULL;
  }

  property_animation->values.from.grect = element->frame;
  property_animation->values.to.grect = to_frame;

  animation->animation = property_animation;
  list1_append(&self->stage_layer.animations, &animation->node);

  Animation *base_animation = (Animation*) property_animation;
  animation_set_duration(base_animation, animation->duration);
  animation_set_curve(base_animation, animation->curve);
  animation_set_handlers(base_animation, (AnimationHandlers) {
    .stopped = animation_stopped,
  }, self);

  animation_schedule(base_animation);

  return animation;
}

static void window_load(Window *window) {
  SimplyStage *self = window_get_user_data(window);

  simply_window_load(&self->window);

  Layer *window_layer = window_get_root_layer(window);
  GRect frame = layer_get_frame(window_layer);
  frame.origin = GPointZero;

  Layer *layer = layer_create_with_data(frame, sizeof(void*));
  self->window.layer = self->stage_layer.layer = layer;
  *(void**) layer_get_data(layer) = self;
  layer_set_update_proc(layer, layer_update_callback);
  scroll_layer_add_child(self->window.scroll_layer, layer);
  scroll_layer_set_click_config_onto_window(self->window.scroll_layer, window);
}

static void window_appear(Window *window) {
  SimplyStage *self = window_get_user_data(window);
  simply_window_stack_send_show(self->window.simply->window_stack, &self->window);

  simply_stage_update_ticker(self);
}

static void window_disappear(Window *window) {
  SimplyStage *self = window_get_user_data(window);
  simply_window_stack_send_hide(self->window.simply->window_stack, &self->window);

  simply_stage_clear(self);
}

static void window_unload(Window *window) {
  SimplyStage *self = window_get_user_data(window);

  layer_destroy(self->stage_layer.layer);
  self->window.layer = self->stage_layer.layer = NULL;

  simply_window_unload(&self->window);
}

void simply_stage_update(SimplyStage *self) {
  if (self->stage_layer.layer) {
    layer_mark_dirty(self->stage_layer.layer);
  }
}

void handle_tick(struct tm *tick_time, TimeUnits units_changed) {
  window_stack_schedule_top_window_render();
}

void simply_stage_update_ticker(SimplyStage *self) {
  TimeUnits units = 0;

  SimplyElementCommon *element = (SimplyElementCommon*) self->stage_layer.elements;
  while (element) {
    if (element->type == SimplyElementTypeText) {
      units |= ((SimplyElementText*) element)->time_units;
    }
    element = (SimplyElementCommon*) element->node.next;
  }

  if (units) {
    tick_timer_service_subscribe(units, handle_tick);
  } else {
    tick_timer_service_unsubscribe();
  }
}

SimplyStage *simply_stage_create(Simply *simply) {
  SimplyStage *self = malloc(sizeof(*self));
  *self = (SimplyStage) { .window.simply = simply };

  simply_window_init(&self->window, simply);
  simply_window_set_background_color(&self->window, GColorBlack);

  window_set_user_data(self->window.window, self);
  window_set_window_handlers(self->window.window, (WindowHandlers) {
    .load = window_load,
    .appear = window_appear,
    .disappear = window_disappear,
    .unload = window_unload,
  });

  return self;
}

void simply_stage_destroy(SimplyStage *self) {
  if (!self) {
    return;
  }

  simply_window_deinit(&self->window);

  free(self);
}
