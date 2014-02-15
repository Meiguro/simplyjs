#include "simply_accel.h"

#include "simply_msg.h"

#include "simplyjs.h"

#include <pebble.h>

SimplyAccel *s_accel = NULL;

static void handle_accel_tap(AccelAxisType axis, int32_t direction) {
  simply_msg_accel_tap(axis, direction);
}

SimplyAccel *simply_accel_create(void) {
  if (s_accel) {
    return s_accel;
  }

  accel_tap_service_subscribe(handle_accel_tap);

  return NULL;
}

void simply_accel_destroy(SimplyAccel *self) {
  if (!s_accel) {
    return;
  }

  accel_tap_service_unsubscribe();

  free(self);

  s_accel = NULL;
}

