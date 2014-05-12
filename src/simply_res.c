#include "simply_res.h"

#include <pebble.h>

static bool id_filter(List1Node *node, void *data) {
  return (((SimplyImage*) node)->id == (uint32_t)(uintptr_t) data);
}

static void destroy_image(SimplyRes *self, SimplyImage *image) {
  list1_remove(&self->images, &image->node);
  free(image->bitmap.addr);
  free(image);
}

GBitmap *simply_res_add_image(SimplyRes *self, uint32_t id, int16_t width, int16_t height, uint32_t *pixels) {
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);
  if (image) {
    free(image->bitmap.addr);
    image->bitmap.addr = NULL;
  } else {
    image = malloc(sizeof(*image));
    *image = (SimplyImage) { .id = id };
    list1_prepend(&self->images, &image->node);
  }

  uint16_t row_size_bytes = (1 + (width - 1) / 32) * 4;
  size_t pixels_size = height * row_size_bytes;
  image->bitmap = (GBitmap) {
    .row_size_bytes = row_size_bytes,
    .bounds.size = { width, height },
  };

  image->bitmap.addr = malloc(pixels_size);
  memcpy(image->bitmap.addr, pixels, pixels_size);

  Window *window = window_stack_get_top_window();
  layer_mark_dirty(window_get_root_layer(window));

  return &image->bitmap;
}

void simply_res_remove_image(SimplyRes *self, uint32_t id) {
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);
  if (image) {
    destroy_image(self, image);
  }
}

GBitmap *simply_res_get_image(SimplyRes *self, uint32_t id) {
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);
  return image ? &image->bitmap : NULL;
}

void simply_res_clear(SimplyRes *self) {
  while (self->images) {
    destroy_image(self, (SimplyImage*) self->images);
  }
}

SimplyRes *simply_res_create() {
  SimplyRes *self = malloc(sizeof(*self));
  *self = (SimplyRes) { .images = NULL };
  return self;
}

void simply_res_destroy(SimplyRes *self) {
  simply_res_clear(self);
  free(self);
}
