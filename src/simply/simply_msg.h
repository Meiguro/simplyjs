#pragma once

#include "simply.h"

#include "util/list1.h"

#include <pebble.h>

typedef struct SimplyMsg SimplyMsg;

struct SimplyMsg {
  Simply *simply;
  List1Node *queue;
  uint32_t send_delay_ms;
  AppTimer *send_timer;
  uint8_t *send_buffer;
  size_t send_length;
};

typedef struct SimplyPacket SimplyPacket;

struct SimplyPacket {
  List1Node node;
  uint16_t length;
  void *buffer;
};

SimplyMsg *simply_msg_create(Simply *simply);
void simply_msg_destroy(SimplyMsg *self);
bool simply_msg_has_communicated();
void simply_msg_show_disconnected(SimplyMsg *self);

bool simply_msg_single_click(SimplyMsg *self, ButtonId button);
bool simply_msg_long_click(SimplyMsg *self, ButtonId button);

bool simply_msg_window_show(SimplyMsg *self, uint32_t id);
bool simply_msg_window_hide(SimplyMsg *self, uint32_t id);

bool simply_msg_accel_tap(SimplyMsg *self, AccelAxisType axis, int32_t direction);
bool simply_msg_accel_data(SimplyMsg *self, AccelData *accel, uint32_t num_samples, bool is_peek);

bool simply_msg_menu_get_section(SimplyMsg *self, uint16_t index);
bool simply_msg_menu_get_item(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_select_click(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_select_long_click(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_menu_hide(SimplyMsg *self, uint16_t section, uint16_t index);
bool simply_msg_send_menu_selection(SimplyMsg *self);

bool simply_msg_animate_element_done(SimplyMsg *self, uint32_t id);
