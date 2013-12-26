#include "simplyjs.h"

#include "simply_ui.h"
#include "simply_msg.h"

#include <pebble.h>

static SimplyData *init(void) {
  SimplyData *simply = simply_create();
  simply_msg_init(simply);
  return simply;
}

static void deinit(SimplyData *simply) {
  simply_msg_deinit();
  simply_destroy(simply);
}

int main(void) {
  SimplyData *simply = init();
  app_event_loop();
  deinit(simply);
}
