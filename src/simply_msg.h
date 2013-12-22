#pragma once

#include "simply_ui.h"

#include <pebble.h>

void simply_msg_init(SimplyData *simply);

void simply_msg_deinit();

bool simply_msg_single_click(ButtonId button);

bool simply_msg_long_click(ButtonId button);

bool simply_msg_accel_tap(AccelAxisType axis, int32_t direction);

