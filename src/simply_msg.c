#include "simply_msg.h"

#include "simply_ui.h"

#include <pebble.h>

typedef enum SimplyACmd SimplyACmd;

enum SimplyACmd {
  SimplyACmd_setText = 0,
  SimplyACmd_singleClick = 1,
  SimplyACmd_longClick = 2,
  SimplyACmd_accelTap = 3,
};

static void handle_set_text(DictionaryIterator *iter, SimplyData *simply) {
  Tuple *tuple;
  bool clear = false;
  if ((tuple = dict_find(iter, 4))) {
    clear = true;
  }
  if ((tuple = dict_find(iter, 1))) {
    simply_set_text(simply, &simply->title_text, tuple->value->cstring);
  } else if (clear) {
    simply_set_text(simply, &simply->title_text, NULL);
  }
  if ((tuple = dict_find(iter, 2))) {
    simply_set_text(simply, &simply->subtitle_text, tuple->value->cstring);
  } else if (clear) {
    simply_set_text(simply, &simply->subtitle_text, NULL);
  }
  if ((tuple = dict_find(iter, 3))) {
    simply_set_text(simply, &simply->body_text, tuple->value->cstring);
  } else if (clear) {
    simply_set_text(simply, &simply->body_text, NULL);
  }
}

static void received_callback(DictionaryIterator *iter, void *context) {
  Tuple *tuple = dict_find(iter, 0);
  if (!tuple) {
    return;
  }

  switch (tuple->value->uint8) {
    case SimplyACmd_setText:
      handle_set_text(iter, context);
      break;
  }
}

static void dropped_callback(AppMessageResult reason, void *context) {
}

static void sent_callback(DictionaryIterator *iter, void *context) {
}

static void failed_callback(DictionaryIterator *iter, AppMessageResult reason, void *context) {
}

void simply_msg_init(SimplyData *simply) {
  const uint32_t size_inbound = 1024;
  const uint32_t size_outbound = 512;
  app_message_open(size_inbound, size_outbound);

  app_message_set_context(simply);

  app_message_register_inbox_received(received_callback);
  app_message_register_inbox_dropped(dropped_callback);
  app_message_register_outbox_sent(sent_callback);
  app_message_register_outbox_failed(failed_callback);
}

void simply_msg_deinit() {
  app_message_deregister_callbacks();
}

bool simply_msg_single_click(ButtonId button) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_singleClick);
  dict_write_uint8(iter, 1, button);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_long_click(ButtonId button) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_longClick);
  dict_write_uint8(iter, 1, button);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_accel_tap(AccelAxisType axis, int32_t direction) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_accelTap);
  dict_write_uint8(iter, 1, axis);
  dict_write_int8(iter, 2, direction);
  return (app_message_outbox_send() == APP_MSG_OK);
}

