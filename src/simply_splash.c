#include "simply_splash.h"

#include "simplyjs.h"

#include <pebble.h>

static void window_load(Window *window) {
  SimplySplash *self = window_get_user_data(window);

  self->logo = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_LOGO_SPLASH);

  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  self->logo_layer = bitmap_layer_create(bounds);
  bitmap_layer_set_bitmap(self->logo_layer, self->logo);
  bitmap_layer_set_alignment(self->logo_layer, GAlignCenter);
  layer_add_child(window_layer, bitmap_layer_get_layer(self->logo_layer));
}

static void window_disappear(Window *window) {
  SimplySplash *self = window_get_user_data(window);
  bool animated = true;
  window_stack_remove(self->window, animated);
  simply_splash_destroy(self);
}

SimplySplash *simply_splash_create(Simply *simply) {
  SimplySplash *self = malloc(sizeof(*self));
  *self = (SimplySplash) { .simply = simply };

  self->window = window_create();
  window_set_user_data(self->window, self);
  window_set_fullscreen(self->window, true);
  window_set_background_color(self->window, GColorBlack);
  window_set_window_handlers(self->window, (WindowHandlers) {
    .load = window_load,
    .disappear = window_disappear,
  });

  return self;
}

void simply_splash_destroy(SimplySplash *self) {
  bitmap_layer_destroy(self->logo_layer);
  gbitmap_destroy(self->logo);
  window_destroy(self->window);

  self->simply->splash = NULL;

  free(self);
}

