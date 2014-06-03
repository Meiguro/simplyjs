#pragma once

#include "simply.h"

#include "util/list1.h"

#include <pebble.h>

#define TRANSACTION_ID_INVALID (-1)

typedef struct SimplyMsg SimplyMsg;

struct SimplyMsg {
  Simply *simply;
  List1Node *queue;
  uint32_t send_delay_ms;
};

typedef struct SimplyPacket SimplyPacket;

struct SimplyPacket {
  List1Node node;
  size_t length;
  void *buffer;
};

SimplyMsg *simply_msg_create(Simply *simply);
void simply_msg_destroy(SimplyMsg *self);
bool simply_msg_has_communicated();

bool simply_msg_single_click(SimplyMsg *self, ButtonId button);
bool simply_msg_long_click(SimplyMsg *self, ButtonId button);

bool simply_msg_window_show(SimplyMsg *self, uint32_t id);
bool simply_msg_window_hide(SimplyMsg *self, uint32_t id);

bool simply_msg_accel_tap(SimplyMsg *self, AccelAxisType axis, int32_t direction);
bool simply_msg_accel_data(SimplyMsg *self, AccelData *accel, uint32_t num_samples, int32_t transaction_id);

bool simply_msg_menu_get_section(SimplyMsg *self, uint16_t index);
bool simply_msg_menu_get_item(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_select_click(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_select_long_click(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_hide(SimplyMsg *self, uint16_t section, uint16_t index);

bool simply_msg_animate_element_done(SimplyMsg *self, uint16_t index);
