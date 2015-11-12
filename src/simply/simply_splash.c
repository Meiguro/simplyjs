#include "simply_splash.h"

#include "simply.h"

#include "util/graphics.h"

#include <pebble.h>

void layer_update_callback(Layer *layer, GContext *ctx) {
  SimplySplash *self = (SimplySplash*) window_get_user_data((Window*) layer);

  GRect frame = layer_get_frame(layer);

#if defined(SPLASH_LOGO)
  graphics_draw_bitmap_centered(ctx, self->image, frame);
#else
  graphics_draw_bitmap_in_rect(ctx, self->image, frame);
#endif
}


static void window_load(Window *window) {
  SimplySplash *self = window_get_user_data(window);

#if defined(SPLASH_LOGO)
  self->image = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_LOGO_SPLASH);
#else
  self->image = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_TILE_SPLASH);
#endif
}

static void window_disappear(Window *window) {
  SimplySplash *self = window_get_user_data(window);
  bool animated = false;
  window_stack_remove(self->window, animated);
  simply_splash_destroy(self);
}

SimplySplash *simply_splash_create(Simply *simply) {
  SimplySplash *self = malloc(sizeof(*self));
  *self = (SimplySplash) { .simply = simply };

  self->window = window_create();
  window_set_user_data(self->window, self);
  window_set_fullscreen(self->window, false);
  window_set_background_color(self->window, GColorWhite);
  window_set_window_handlers(self->window, (WindowHandlers) {
    .load = window_load,
    .disappear = window_disappear,
  });

  layer_set_update_proc(window_get_root_layer(self->window), layer_update_callback);

  return self;
}

void simply_splash_destroy(SimplySplash *self) {
  gbitmap_destroy(self->image);

  window_destroy(self->window);

  self->simply->splash = NULL;

  free(self);
}

