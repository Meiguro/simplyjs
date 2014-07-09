#pragma once

#include "simply.h"

#include <pebble.h>

typedef struct SimplyAccel SimplyAccel;

struct SimplyAccel {
  Simply *simply;
  uint16_t num_samples;
  AccelSamplingRate rate:8;
  bool data_subscribed;
};

SimplyAccel *simply_accel_create(Simply *simply);
void simply_accel_destroy(SimplyAccel *self);

void simply_accel_set_data_subscribe(SimplyAccel *self, bool subscribe);

void simply_accel_peek(SimplyAccel *self, AccelData *data);
