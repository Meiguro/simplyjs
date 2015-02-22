#pragma once

#include "simply_msg.h"

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

bool simply_accel_handle_packet(Simply *simply, Packet *packet);
