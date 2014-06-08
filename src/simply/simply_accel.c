#include "simply_accel.h"

#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

SimplyAccel *s_accel = NULL;

static void handle_accel_data(AccelData *data, uint32_t num_samples) {
  simply_msg_accel_data(s_accel->simply->msg, data, num_samples, TRANSACTION_ID_INVALID);
}

void simply_accel_set_data_rate(SimplyAccel *self, AccelSamplingRate rate) {
  self->rate = rate;
  accel_service_set_sampling_rate(rate);
}

void simply_accel_set_data_samples(SimplyAccel *self, uint32_t num_samples) {
  self->num_samples = num_samples;
  accel_service_set_samples_per_update(num_samples);
  if (!self->data_subscribed) {
    return;
  }
  simply_accel_set_data_subscribe(self, false);
  simply_accel_set_data_subscribe(self, true);
}

void simply_accel_set_data_subscribe(SimplyAccel *self, bool subscribe) {
  if (self->data_subscribed == subscribe) {
    return;
  }
  if (subscribe) {
    accel_data_service_subscribe(self->num_samples, handle_accel_data);
    accel_service_set_sampling_rate(self->rate);
  } else {
    accel_data_service_unsubscribe();
  }
  self->data_subscribed = subscribe;
}

void simply_accel_peek(SimplyAccel *self, AccelData *data) {
  if (self->data_subscribed) {
    return;
  }
  accel_service_peek(data);
}

static void handle_accel_tap(AccelAxisType axis, int32_t direction) {
  simply_msg_accel_tap(s_accel->simply->msg, axis, direction);
}

SimplyAccel *simply_accel_create(Simply *simply) {
  if (s_accel) {
    return s_accel;
  }

  SimplyAccel *self = malloc(sizeof(*self));
  *self = (SimplyAccel) {
    .simply = simply,
    .rate = ACCEL_SAMPLING_100HZ,
    .num_samples = 25,
  };
  s_accel = self;

  accel_tap_service_subscribe(handle_accel_tap);

  return self;
}

void simply_accel_destroy(SimplyAccel *self) {
  if (!self) {
    return;
  }

  accel_tap_service_unsubscribe();

  free(self);

  s_accel = NULL;
}

