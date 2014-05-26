#include "simply_stage.h"

#include "simply_res.h"

#include "simply_msg.h"

#include "simplyjs.h"

#include "util/graphics.h"
#include "util/string.h"

#include <pebble.h>

static bool id_filter(List1Node *node, void *data) {
  return (((SimplyElementCommon*) node)->id == (uint32_t)(uintptr_t) data);
}

static void destroy_element(SimplyStage *self, SimplyElementCommon *element) {
  if (!element) { return; }
  list1_remove(&self->stage_layer.elements, &element->node);
  free(element);
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

static void text_element_draw(GContext *ctx, SimplyStage *self, SimplyElementText *element) {
  rect_element_draw(ctx, self, (SimplyElementRect*) element);
  if (element->text_color != GColorClear && is_string(element->text)) {
    graphics_context_set_text_color(ctx, element->text_color);
    graphics_draw_text(ctx, element->text, element->font, element->frame,
        element->overflow_mode, element->alignment, NULL);
  }
}

static void image_element_draw(GContext *ctx, SimplyStage *self, SimplyElementImage *element) {
  graphics_context_set_compositing_mode(ctx, element->compositing);
  rect_element_draw_background(ctx, self, (SimplyElementRect*) element);
  GBitmap *bitmap = simply_res_get_image(self->window.simply->res, element->image);
  if (bitmap) {
    graphics_draw_bitmap_centered(ctx, bitmap, element->frame);
  }
  rect_element_draw_border(ctx, self, (SimplyElementRect*) element);
  graphics_context_set_compositing_mode(ctx, GCompOpAssign);
}

static void layer_update_callback(Layer *layer, GContext *ctx) {
  SimplyStage *self = *(void**) layer_get_data(layer);

  SimplyElementCommon *element = (SimplyElementCommon*) self->stage_layer.elements;
  while (element) {
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
    }
    element = (SimplyElementCommon*) element->node.next;
  }
}

static void *malloc0(size_t size) {
  void *buf = malloc(size);
  memset(buf, 0, size);
  return buf;
}

static SimplyElementCommon* alloc_element(SimplyElementType type) {
  switch (type) {
    case SimplyElementTypeNone: return NULL;
    case SimplyElementTypeRect: return malloc0(sizeof(SimplyElementRect));
    case SimplyElementTypeCircle: return malloc0(sizeof(SimplyElementCircle));
    case SimplyElementTypeText: return malloc0(sizeof(SimplyElementText));
    case SimplyElementTypeImage: return malloc0(sizeof(SimplyElementImage));
  }
  return NULL;
}

SimplyElementCommon* simply_stage_auto_element(SimplyStage *self, uint32_t id, SimplyElementType type) {
  if (!id) {
    return NULL;
  }
  SimplyElementCommon* element = (SimplyElementCommon*) list1_find(
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

SimplyElementCommon* simply_stage_insert_element(SimplyStage *self, int index, SimplyElementCommon *element) {
  simply_stage_remove_element(self, element);
  return (SimplyElementCommon*) list1_insert(&self->stage_layer.elements, index, &element->node);
}

SimplyElementCommon* simply_stage_remove_element(SimplyStage *self, SimplyElementCommon *element) {
  return (SimplyElementCommon*) list1_remove(&self->stage_layer.elements, &element->node);
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
  simply_msg_window_show(self->window.id);
}

static void window_disappear(Window *window) {
  SimplyStage *self = window_get_user_data(window);
  simply_msg_window_hide(self->window.id);

  while (self->stage_layer.elements) {
    destroy_element(self, (SimplyElementCommon*) self->stage_layer.elements);
  }
}

static void window_unload(Window *window) {
  SimplyStage *self = window_get_user_data(window);

  layer_destroy(self->stage_layer.layer);
  self->window.layer = self->stage_layer.layer = NULL;

  simply_window_unload(&self->window);
}

void simply_stage_show(SimplyStage *self) {
  if (!self->window.window) {
    return;
  }
  if (!window_stack_contains_window(self->window.window)) {
    bool animated = true;
    window_stack_push(self->window.window, animated);
  }
}

void simply_stage_update(SimplyStage *self) {
  layer_mark_dirty(self->stage_layer.layer);
}

SimplyStage *simply_stage_create(Simply *simply) {
  SimplyStage *self = malloc(sizeof(*self));
  *self = (SimplyStage) { .window.simply = simply };

  simply_window_init(&self->window, simply);

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
