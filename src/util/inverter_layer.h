#pragma once

#include <pebble.h>

#include "util/math.h"

#ifdef PBL_SDK_3

typedef struct InverterLayer InverterLayer;
struct InverterLayer;

InverterLayer *inverter_layer_create(GRect bounds);
void inverter_layer_destroy(InverterLayer *inverter_layer);
Layer *inverter_layer_get_layer(InverterLayer *inverter_layer);

#endif
