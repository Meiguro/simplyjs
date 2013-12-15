#include "simply-js.h"

#include "simply_ui.h"

#include <pebble.h>

static void init(void) {
  SimplyData *simply = simply_create();
  (void) simply;
}

static void deinit(void) {
  simply_destroy(NULL);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
