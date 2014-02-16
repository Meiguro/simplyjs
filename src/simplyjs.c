#include "simplyjs.h"

#include "simply_accel.h"
#include "simply_splash.h"
#include "simply_ui.h"
#include "simply_msg.h"

#include <pebble.h>

static Simply *init(void) {
  Simply *simply = malloc(sizeof(*simply));
  simply->accel = simply_accel_create();
  simply->splash = simply_splash_create(simply);
  simply->ui = simply_ui_create();

  bool animated = true;
  window_stack_push(simply->splash->window, animated);

  simply_msg_init(simply);
  return simply;
}

static void deinit(Simply *simply) {
  simply_msg_deinit();
  simply_ui_destroy(simply->ui);
  simply_accel_destroy(simply->accel);
}

int main(void) {
  Simply *simply = init();
  app_event_loop();
  deinit(simply);
}
