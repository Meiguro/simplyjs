/**
 *  Pebble.js Project main file.
 */

#include <pebble.h>
#include "simply/simply.h"

/**
 * By default, we 'simply' load Simply and start running it.
 */
int main(void) {
  Simply *simply = simply_init();
  app_event_loop();
  simply_deinit(simply);
}
