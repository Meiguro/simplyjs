#include "simply_msg.h"

#include "simply_accel.h"
#include "simply_menu.h"
#include "simply_ui.h"

#include "simplyjs.h"

#include "util/string.h"

#include <pebble.h>

typedef enum SimplyACmd SimplyACmd;

enum SimplyACmd {
  SimplyACmd_setText = 0,
  SimplyACmd_singleClick,
  SimplyACmd_longClick,
  SimplyACmd_accelTap,
  SimplyACmd_vibe,
  SimplyACmd_setScrollable,
  SimplyACmd_setStyle,
  SimplyACmd_setFullscreen,
  SimplyACmd_accelData,
  SimplyACmd_getAccelData,
  SimplyACmd_configAccelData,
  SimplyACmd_configButtons,
  SimplyACmd_showUi,
  SimplyACmd_uiExit,
  SimplyACmd_showMenu,
  SimplyACmd_setMenuSection,
  SimplyACmd_getMenuSection,
  SimplyACmd_setMenuItem,
  SimplyACmd_getMenuItem,
  SimplyACmd_menuSelect,
  SimplyACmd_menuLongSelect,
  SimplyACmd_menuExit,
};

typedef enum VibeType VibeType;

enum VibeType {
  VibeShort = 0,
  VibeLong = 1,
  VibeDouble = 2,
};

static void check_splash(Simply *simply) {
  if (simply->splash) {
    simply_ui_show(simply->ui);
  }
}

static void handle_set_text(DictionaryIterator *iter, Simply *simply) {
  SimplyUi *ui = simply->ui;
  Tuple *tuple;
  bool clear = false;
  if ((tuple = dict_find(iter, 4))) {
    clear = true;
  }
  if ((tuple = dict_find(iter, 1)) || clear) {
    simply_ui_set_text(ui, &ui->title_text, tuple ? tuple->value->cstring : NULL);
  }
  if ((tuple = dict_find(iter, 2)) || clear) {
    simply_ui_set_text(ui, &ui->subtitle_text, tuple ? tuple->value->cstring : NULL);
  }
  if ((tuple = dict_find(iter, 3)) || clear) {
    simply_ui_set_text(ui, &ui->body_text, tuple ? tuple->value->cstring : NULL);
  }

  check_splash(simply);
}

static void handle_vibe(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    switch ((VibeType) tuple->value->int32) {
      case VibeShort: vibes_short_pulse(); break;
      case VibeLong: vibes_short_pulse(); break;
      case VibeDouble: vibes_double_pulse(); break;
    }
  }
}

static void handle_set_scrollable(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    simply_ui_set_scrollable(simply->ui, tuple->value->int32);
  }
}

static void handle_set_style(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    simply_ui_set_style(simply->ui, tuple->value->int32);
  }
}

static void handle_set_fullscreen(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    simply_ui_set_fullscreen(simply->ui, tuple->value->int32);
  }
}

static void handle_config_buttons(DictionaryIterator *iter, Simply *simply) {
  SimplyUi *ui = simply->ui;
  Tuple *tuple;
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if ((tuple = dict_find(iter, i + 1))) {
      simply_ui_set_button(ui, i, tuple->value->int32);
    }
  }
}

static void get_accel_data_timer_callback(void *context) {
  Simply *simply = context;
  AccelData data = { .x = 0 };
  simply_accel_peek(simply->accel, &data);
  if (!simply_msg_accel_data(&data, 1, 0)) {
    app_timer_register(10, get_accel_data_timer_callback, simply);
  }
}

static void handle_get_accel_data(DictionaryIterator *iter, Simply *simply) {
  app_timer_register(10, get_accel_data_timer_callback, simply);
}

static void handle_set_accel_config(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    simply_accel_set_data_rate(simply->accel, tuple->value->int32);
  }
  if ((tuple = dict_find(iter, 2))) {
    simply_accel_set_data_samples(simply->accel, tuple->value->int32);
  }
  if ((tuple = dict_find(iter, 3))) {
    simply_accel_set_data_subscribe(simply->accel, tuple->value->int32);
  }
}

static void handle_show_ui(DictionaryIterator *iter, Simply *simply) {
  simply_ui_show(simply->ui);
}

static void handle_show_menu(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    simply_menu_set_num_sections(simply->menu, tuple->value->int32);
  }
  simply_menu_show(simply->menu);
}

static void handle_set_menu_section(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  uint16_t section_index = 0;
  uint16_t num_items = 1;
  char *title = "Section";
  if ((tuple = dict_find(iter, 1))) {
    section_index = tuple->value->uint16;
  }
  if ((tuple = dict_find(iter, 2))) {
    num_items = tuple->value->uint16;
  }
  if ((tuple = dict_find(iter, 3))) {
    title = tuple->value->cstring;
  }
  SimplyMenuSection *section = malloc(sizeof(*section));
  *section = (SimplyMenuSection) {
    .index = section_index,
    .num_items = num_items,
    .title = strdup2(title),
  };
  simply_menu_add_section(simply->menu, section);
}

static void handle_set_menu_item(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  uint16_t section_index = 0;
  uint16_t row = 0;
  char *title = NULL;
  char *subtitle = NULL;
  if ((tuple = dict_find(iter, 1))) {
    section_index = tuple->value->uint16;
  }
  if ((tuple = dict_find(iter, 2))) {
    row = tuple->value->uint16;
  }
  if ((tuple = dict_find(iter, 3))) {
    title = tuple->value->cstring;
  }
  if ((tuple = dict_find(iter, 4))) {
    subtitle = tuple->value->cstring;
  }
  SimplyMenuItem *item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = section_index,
    .index = row,
    .title = strdup2(title),
    .subtitle = strdup2(subtitle),
  };
  simply_menu_add_item(simply->menu, item);
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
    case SimplyACmd_vibe:
      handle_vibe(iter, context);
      break;
    case SimplyACmd_setScrollable:
      handle_set_scrollable(iter, context);
      break;
    case SimplyACmd_setStyle:
      handle_set_style(iter, context);
      break;
    case SimplyACmd_setFullscreen:
      handle_set_fullscreen(iter, context);
      break;
    case SimplyACmd_getAccelData:
      handle_get_accel_data(iter, context);
      break;
    case SimplyACmd_configAccelData:
      handle_set_accel_config(iter, context);
      break;
    case SimplyACmd_configButtons:
      handle_config_buttons(iter, context);
      break;
    case SimplyACmd_showUi:
      handle_show_ui(iter, context);
      break;
    case SimplyACmd_showMenu:
      handle_show_menu(iter, context);
      break;
    case SimplyACmd_setMenuSection:
      handle_set_menu_section(iter, context);
      break;
    case SimplyACmd_setMenuItem:
      handle_set_menu_item(iter, context);
      break;
  }
}

static void dropped_callback(AppMessageResult reason, void *context) {
}

static void sent_callback(DictionaryIterator *iter, void *context) {
}

static void failed_callback(DictionaryIterator *iter, AppMessageResult reason, Simply *simply) {
  SimplyUi *ui = simply->ui;
  if (reason == APP_MSG_NOT_CONNECTED) {
    simply_ui_set_text(ui, &ui->subtitle_text, "Disconnected");
    simply_ui_set_text(ui, &ui->body_text, "Run the Pebble Phone App");

    check_splash(simply);
  }
}

void simply_msg_init(Simply *simply) {
  const uint32_t size_inbound = 2048;
  const uint32_t size_outbound = 512;
  app_message_open(size_inbound, size_outbound);

  app_message_set_context(simply);

  app_message_register_inbox_received(received_callback);
  app_message_register_inbox_dropped(dropped_callback);
  app_message_register_outbox_sent(sent_callback);
  app_message_register_outbox_failed((AppMessageOutboxFailed) failed_callback);
}

void simply_msg_deinit() {
  app_message_deregister_callbacks();
}

static bool send_click(SimplyACmd type, ButtonId button) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, type);
  dict_write_uint8(iter, 1, button);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_single_click(ButtonId button) {
  return send_click(SimplyACmd_singleClick, button);
}

bool simply_msg_long_click(ButtonId button) {
  return send_click(SimplyACmd_longClick, button);
}

bool simply_msg_ui_exit() {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_uiExit);
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

bool simply_msg_accel_data(AccelData *data, uint32_t num_samples, int32_t transaction_id) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_accelData);
  if (transaction_id >= 0) {
    dict_write_int32(iter, 1, transaction_id);
  }
  dict_write_uint8(iter, 2, num_samples);
  dict_write_data(iter, 3, (uint8_t*) data, sizeof(*data) * num_samples);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_menu_get_section(uint16_t index) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_getMenuSection);
  dict_write_uint16(iter, 1, index);
  return (app_message_outbox_send() == APP_MSG_OK);
}

static bool send_menu_item(SimplyACmd type, uint16_t section, uint16_t index) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, type);
  dict_write_uint16(iter, 1, section);
  dict_write_uint16(iter, 2, index);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_menu_get_item(uint16_t section, uint16_t index) {
  return send_menu_item(SimplyACmd_getMenuItem, section, index);
}

bool simply_msg_menu_select_click(uint16_t section, uint16_t index) {
  return send_menu_item(SimplyACmd_menuSelect, section, index);
}

bool simply_msg_menu_select_long_click(uint16_t section, uint16_t index) {
  return send_menu_item(SimplyACmd_menuLongSelect, section, index);
}

bool simply_msg_menu_exit(uint16_t section, uint16_t index) {
  return send_menu_item(SimplyACmd_menuExit, section, index);
}

