#pragma once

#include <pebble.h>

typedef struct SimplyAccel SimplyAccel;

struct SimplyAccel {
};

SimplyAccel *simply_accel_create(void);

void simply_accel_destroy(SimplyAccel *self);

