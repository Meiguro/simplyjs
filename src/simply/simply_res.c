#include "simply_res.h"

#include "util/color.h"
#include "util/graphics.h"
#include "util/memory.h"
#include "util/window.h"

#include <pebble.h>

static bool id_filter(List1Node *node, void *data) {
  return (((SimplyResItemCommon*) node)->id == (uint32_t)(uintptr_t) data);
}

static void destroy_image(SimplyRes *self, SimplyImage *image) {
  if (!image) {
    return;
  }

  list1_remove(&self->images, &image->node);
  gbitmap_destroy(image->bitmap);
  free(image->palette);
}

static void destroy_font(SimplyRes *self, SimplyFont *font) {
  if (!font) {
    return;
  }

  list1_remove(&self->fonts, &font->node);
  fonts_unload_custom_font(font->font);
  free(font);
}

static void setup_image(SimplyImage *image) {
  image->is_palette_black_and_white = gbitmap_is_palette_black_and_white(image->bitmap);

  if (!image->is_palette_black_and_white) {
    return;
  }

  GColor8 *palette = gbitmap_get_palette(image->bitmap);
  GColor8 *palette_copy = malloc0(2 * sizeof(GColor8));
  memcpy(palette_copy, palette, 2 * sizeof(GColor8));
  gbitmap_set_palette(image->bitmap, palette_copy, false);
  image->palette = palette_copy;
}

bool simply_res_evict_image(SimplyRes *self) {
  SimplyImage *last_image = (SimplyImage *)list1_last(self->images);
  if (!last_image) {
    return false;
  }

  destroy_image(self, last_image);
  return true;
}

static void add_image(SimplyRes *self, SimplyImage *image) {
  list1_prepend(&self->images, &image->node);

  setup_image(image);

  window_stack_schedule_top_window_render();
}

typedef GBitmap *(*GBitmapCreator)(SimplyImage *image, void *data);

static SimplyImage *create_image(SimplyRes *self, GBitmapCreator creator, void *data) {
  SimplyImage *image = NULL;
  while (!(image = malloc0(sizeof(*image)))) {
    if (!simply_res_evict_image(self)) {
      return NULL;
    }
  }

  GBitmap *bitmap = NULL;
  while (!(bitmap = creator(image, data))) {
    if (!simply_res_evict_image(self)) {
      free(image);
      return NULL;
    }
  }

  image->bitmap = bitmap;

  return image;
}

static GBitmap *create_bitmap_with_id(SimplyImage *image, void *data) {
  const uint32_t id = (uint32_t)(uintptr_t) data;
  GBitmap *bitmap = gbitmap_create_with_resource(id);
  if (bitmap) {
    image->id = id;
  }
  return bitmap;
}

SimplyImage *simply_res_add_bundled_image(SimplyRes *self, uint32_t id) {
  SimplyImage *image = create_image(self, create_bitmap_with_id, (void*)(uintptr_t) id);
  if (image) {
    add_image(self, image);
  }
  return image;
}

static GBitmap *create_blank_bitmap(SimplyImage *image, void *data) {
  GSize *size = data;
  GBitmap *bitmap = gbitmap_create_blank(*size, GBitmapFormat1Bit);
  if (bitmap) {
    image->bitmap_data = gbitmap_get_data(bitmap);
  }
  return bitmap;
}

SimplyImage *simply_res_add_image(SimplyRes *self, uint32_t id, int16_t width, int16_t height, uint8_t *pixels) {
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);

  if (image) {
    free(gbitmap_get_data(image->bitmap));
    uint16_t row_size_bytes = gbitmap_get_bytes_per_row(image->bitmap);
    gbitmap_set_data(image->bitmap, pixels, GBitmapFormat1Bit, row_size_bytes, true);
    image->bitmap_data = pixels;

    window_stack_schedule_top_window_render();

    return image;
  }

  image = create_image(self, create_blank_bitmap, &GSize(width, height));
  if (image) {
    image->id = id;

    uint16_t row_size_bytes = gbitmap_get_bytes_per_row(image->bitmap);
    size_t pixels_size = height * row_size_bytes;
    memcpy(image->bitmap_data, pixels, pixels_size);

    add_image(self, image);
  }

  return image;
}

void simply_res_remove_image(SimplyRes *self, uint32_t id) {
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);
  if (image) {
    destroy_image(self, image);
  }
}

SimplyImage *simply_res_auto_image(SimplyRes *self, uint32_t id, bool is_placeholder) {
  if (!id) {
    return NULL;
  }
  SimplyImage *image = (SimplyImage*) list1_find(self->images, id_filter, (void*)(uintptr_t) id);
  if (image) {
    return image;
  }
  if (id <= self->num_bundled_res) {
    return simply_res_add_bundled_image(self, id);
  }
  if (is_placeholder) {
    return simply_res_add_image(self, id, 0, 0, NULL);
  }
  return NULL;
}

GFont simply_res_add_custom_font(SimplyRes *self, uint32_t id) {
  SimplyFont *font = malloc(sizeof(*font));
  if (!font) {
    return NULL;
  }

  ResHandle handle = resource_get_handle(id);
  if (!handle) {
    return NULL;
  }

  GFont custom_font = fonts_load_custom_font(handle);
  if (!custom_font) {
    free(font);
    return NULL;
  }

  font->font = custom_font;

  list1_prepend(&self->fonts, &font->node);

  window_stack_schedule_top_window_render();

  return font->font;
}

GFont simply_res_auto_font(SimplyRes *self, uint32_t id) {
  if (!id) {
    return NULL;
  }
  SimplyFont *font = (SimplyFont*) list1_find(self->fonts, id_filter, (void*)(uintptr_t) id);
  if (font) {
    return font->font;
  }
  if (id <= self->num_bundled_res) {
    return simply_res_add_custom_font(self, id);
  }
  return NULL;
}

void simply_res_clear(SimplyRes *self) {
  while (self->images) {
    destroy_image(self, (SimplyImage*) self->images);
  }

  while (self->fonts) {
    destroy_font(self, (SimplyFont*) self->fonts);
  }
}

SimplyRes *simply_res_create() {
  SimplyRes *self = malloc(sizeof(*self));
  *self = (SimplyRes) { .images = NULL };

  while (resource_get_handle(self->num_bundled_res + 1)) {
    ++self->num_bundled_res;
  }

  return self;
}

void simply_res_destroy(SimplyRes *self) {
  simply_res_clear(self);
  free(self);
}
