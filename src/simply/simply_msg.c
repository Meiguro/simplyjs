#include "simply_msg.h"

#include "simply_accel.h"
#include "simply_res.h"
#include "simply_menu.h"
#include "simply_ui.h"

#include "simply.h"

#include "util/string.h"

#include <pebble.h>

typedef enum SimplyACmd SimplyACmd;

enum SimplyACmd {
  SimplyACmd_setWindow = 0,
  SimplyACmd_windowShow,
  SimplyACmd_windowHide,
  SimplyACmd_setUi,
  SimplyACmd_singleClick,
  SimplyACmd_longClick,
  SimplyACmd_accelTap,
  SimplyACmd_vibe,
  SimplyACmd_accelData,
  SimplyACmd_getAccelData,
  SimplyACmd_configAccelData,
  SimplyACmd_configButtons,
  SimplyACmd_setMenu,
  SimplyACmd_setMenuSection,
  SimplyACmd_getMenuSection,
  SimplyACmd_setMenuItem,
  SimplyACmd_getMenuItem,
  SimplyACmd_menuSelect,
  SimplyACmd_menuLongSelect,
  SimplyACmd_image,
};

typedef enum SimplySetUiParam SimplySetUiParam;

enum SimplySetWindowParam {
  SetWindow_clear = 1,
  SetWindow_id,
  SetWindow_action,
  SetWindow_actionUp,
  SetWindow_actionSelect,
  SetWindow_actionDown,
  SetWindow_fullscreen,
  SetWindow_scrollable,
  SetWindowLast,
};

enum SimplySetUiParam {
  SetUi_clear = SetWindow_clear,
  SetUi_id,
  SetUi_title = SetWindowLast,
  SetUi_subtitle,
  SetUi_body,
  SetUi_icon,
  SetUi_subicon,
  SetUi_banner,
  SetUi_style,
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

static void handle_set_window(DictionaryIterator *iter, Simply *simply) {
  Window *base_window = window_stack_get_top_window();
  SimplyWindow *window = window_get_user_data(base_window);
  if (!window || (void*) window == simply->splash) {
    return;
  }
  Tuple *tuple;
  if ((tuple = dict_find(iter, SetWindow_clear))) {
    simply_window_set_action_bar(window, false);
    simply_window_action_bar_clear(window);
  }
  for (tuple = dict_read_first(iter); tuple; tuple = dict_read_next(iter)) {
    switch (tuple->key) {
      case SetWindow_id:
        window->id = tuple->value->uint32;
      case SetWindow_action:
        simply_window_set_action_bar(window, tuple->value->int32);
        break;
      case SetWindow_actionUp:
      case SetWindow_actionSelect:
      case SetWindow_actionDown:
        simply_window_set_action_bar_icon(window, tuple->key - SetWindow_action, tuple->value->int32);
        break;
      case SetWindow_fullscreen:
        simply_window_set_fullscreen(window, tuple->value->int32);
        break;
      case SetWindow_scrollable:
        simply_window_set_scrollable(window, tuple->value->int32);
        break;
    }
  }
}

static void handle_set_ui(DictionaryIterator *iter, Simply *simply) {
  SimplyUi *ui = simply->ui;
  Tuple *tuple;
  if ((tuple = dict_find(iter, SetUi_clear))) {
    simply_ui_clear(ui, tuple->value->uint32);
  }
  for (tuple = dict_read_first(iter); tuple; tuple = dict_read_next(iter)) {
    switch (tuple->key) {
      case SetUi_id:
        ui->window.id = tuple->value->uint32;
      case SetUi_title:
      case SetUi_subtitle:
      case SetUi_body:
        simply_ui_set_text(ui, tuple->key - SetUi_title, tuple->value->cstring);
        break;
      case SetUi_icon:
      case SetUi_subicon:
      case SetUi_banner:
        ui->ui_layer.imagefields[tuple->key - SetUi_icon] = tuple->value->uint32;
        break;
      case SetUi_style:
        simply_ui_set_style(simply->ui, tuple->value->int32);
        break;
    }
  }
  simply_ui_show(simply->ui);
  handle_set_window(iter, simply);
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

static void handle_config_buttons(DictionaryIterator *iter, Simply *simply) {
  SimplyUi *ui = simply->ui;
  Tuple *tuple;
  for (int i = 0; i < NUM_BUTTONS; ++i) {
    if ((tuple = dict_find(iter, i + 1))) {
      simply_window_set_button(&ui->window, i, tuple->value->int32);
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

static void handle_set_menu(DictionaryIterator *iter, Simply *simply) {
  SimplyMenu *menu = simply->menu;
  Tuple *tuple;
  if ((tuple = dict_find(iter, 1))) {
    menu->window.id = tuple->value->uint32;
  }
  if ((tuple = dict_find(iter, 2))) {
    simply_menu_set_num_sections(menu, tuple->value->int32);
  }
  simply_menu_show(menu);
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
  uint32_t icon = 0;
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
  if ((tuple = dict_find(iter, 5))) {
    icon = tuple->value->uint32;
  }
  SimplyMenuItem *item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = section_index,
    .index = row,
    .title = strdup2(title),
    .subtitle = strdup2(subtitle),
    .icon = icon,
  };
  simply_menu_add_item(simply->menu, item);
}

static void handle_set_image(DictionaryIterator *iter, Simply *simply) {
  Tuple *tuple;
  uint32_t id = 0;
  int16_t width = 0;
  int16_t height = 0;
  uint32_t *pixels = NULL;
  if ((tuple = dict_find(iter, 1))) {
    id = tuple->value->uint32;
  }
  if ((tuple = dict_find(iter, 2))) {
    width = tuple->value->int16;
  }
  if ((tuple = dict_find(iter, 3))) {
    height = tuple->value->int16;
  }
  if ((tuple = dict_find(iter, 4))) {
    pixels = (uint32_t*) tuple->value->data;
  }
  simply_res_add_image(simply->res, id, width, height, pixels);
}

static void received_callback(DictionaryIterator *iter, void *context) {
  Tuple *tuple = dict_find(iter, 0);
  if (!tuple) {
    return;
  }

  switch (tuple->value->uint8) {
    case SimplyACmd_setWindow:
      handle_set_window(iter, context);
      break;
    case SimplyACmd_setUi:
      handle_set_ui(iter, context);
      break;
    case SimplyACmd_vibe:
      handle_vibe(iter, context);
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
    case SimplyACmd_setMenu:
      handle_set_menu(iter, context);
      break;
    case SimplyACmd_setMenuSection:
      handle_set_menu_section(iter, context);
      break;
    case SimplyACmd_setMenuItem:
      handle_set_menu_item(iter, context);
      break;
    case SimplyACmd_image:
      handle_set_image(iter, context);
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
    simply_ui_set_text(ui, UiSubtitle, "Disconnected");
    simply_ui_set_text(ui, UiBody, "Run the Pebble Phone App");

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

bool simply_msg_window_show(uint32_t id) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_windowShow);
  dict_write_uint32(iter, 1, id);
  return (app_message_outbox_send() == APP_MSG_OK);
}

bool simply_msg_window_hide(uint32_t id) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_uint8(iter, 0, SimplyACmd_windowHide);
  dict_write_uint32(iter, 1, id);
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
