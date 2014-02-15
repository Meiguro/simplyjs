#include "simplyjs.h"

#include "simply_ui.h"
#include "simply_msg.h"

#include <pebble.h>

static SimplyUi *init(void) {
  SimplyUi *simply = simply_ui_create();
  simply_msg_init(simply);
  return simply;
}

static void deinit(SimplyUi *simply) {
  simply_msg_deinit();
  simply_ui_destroy(simply);
}

int main(void) {
  SimplyUi *simply = init();
  app_event_loop();
  deinit(simply);
}
