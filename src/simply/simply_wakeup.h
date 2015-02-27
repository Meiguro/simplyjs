#pragma once

#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

void simply_wakeup_init(Simply *simply);

bool simply_wakeup_handle_packet(Simply *simply, Packet *packet);
