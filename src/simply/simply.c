#include "simply.h"

#include "simply_accel.h"
#include "simply_res.h"
#include "simply_splash.h"
#include "simply_stage.h"
#include "simply_menu.h"
#include "simply_ui.h"
#include "simply_msg.h"

#include <pebble.h>

Simply *simply_init(void) {
  Simply *simply = malloc(sizeof(*simply));
  simply->accel = simply_accel_create();
  simply->res = simply_res_create();
  simply->splash = simply_splash_create(simply);
  simply->stage = simply_stage_create(simply);
  simply->menu = simply_menu_create(simply);
  simply->ui = simply_ui_create(simply);

  bool animated = false;
  window_stack_push(simply->splash->window, animated);

  simply_msg_init(simply);
  return simply;
}

void simply_deinit(Simply *simply) {
  simply_msg_deinit();
  simply_ui_destroy(simply->ui);
  simply_menu_destroy(simply->menu);
  simply_stage_destroy(simply->stage);
  simply_res_destroy(simply->res);
  simply_accel_destroy(simply->accel);
  free(simply);
}
