#pragma once

#include "simply.h"

#include <pebble.h>

typedef struct SimplyAccel SimplyAccel;

struct SimplyAccel {
  Simply *simply;
  bool data_subscribed;
  AccelSamplingRate rate;
  uint32_t num_samples;
};

SimplyAccel *simply_accel_create(Simply *simply);
void simply_accel_destroy(SimplyAccel *self);

void simply_accel_set_data_rate(SimplyAccel *self, AccelSamplingRate rate);
void simply_accel_set_data_samples(SimplyAccel *self, uint32_t num_samples);
void simply_accel_set_data_subscribe(SimplyAccel *self, bool subscribe);

void simply_accel_peek(SimplyAccel *self, AccelData *data);
