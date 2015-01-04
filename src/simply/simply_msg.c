#include "simply_msg.h"

#include "simply_accel.h"
#include "simply_res.h"
#include "simply_stage.h"
#include "simply_menu.h"
#include "simply_ui.h"
#include "simply_window_stack.h"

#include "simply.h"

#include "util/dict.h"
#include "util/list1.h"
#include "util/math.h"
#include "util/memory.h"
#include "util/string.h"
#include "util/window.h"

#include <pebble.h>

#define SEND_DELAY_MS 10

static const size_t APP_MSG_SIZE_INBOUND = 2044;

static const size_t APP_MSG_SIZE_OUTBOUND = 512;

typedef enum Command Command;

enum Command {
  CommandWindowShow = 1,
  CommandWindowHide,
  CommandWindowShowEvent,
  CommandWindowHideEvent,
  CommandWindowProps,
  CommandWindowButtonConfig,
  CommandWindowActionBar,
  CommandClick,
  CommandLongClick,
  CommandImagePacket,
  CommandCardClear,
  CommandCardText,
  CommandCardImage,
  CommandCardStyle,
  CommandVibe,
  CommandAccelPeek,
  CommandAccelConfig,
  CommandAccelData,
  CommandAccelTap,
  CommandMenuClear,
  CommandMenuClearSection,
  CommandMenuProps,
  CommandMenuSection,
  CommandMenuGetSection,
  CommandMenuItem,
  CommandMenuGetItem,
  CommandMenuSelection,
  CommandMenuGetSelection,
  CommandMenuSelectionEvent,
  CommandMenuSelect,
  CommandMenuLongSelect,
  CommandStageClear,
  CommandElementInsert,
  CommandElementRemove,
  CommandElementCommon,
  CommandElementRadius,
  CommandElementText,
  CommandElementTextStyle,
  CommandElementImage,
  CommandElementAnimate,
  CommandElementAnimateDone,
};

typedef enum WindowType WindowType;

enum WindowType {
  WindowTypeWindow = 0,
  WindowTypeMenu,
  WindowTypeCard,
  WindowTypeLast,
};

typedef enum VibeType VibeType;

enum VibeType {
  VibeShort = 0,
  VibeLong = 1,
  VibeDouble = 2,
};

typedef struct Packet Packet;

struct __attribute__((__packed__)) Packet {
  Command type:16;
  uint16_t length;
};

typedef struct WindowShowPacket WindowShowPacket;

struct __attribute__((__packed__)) WindowShowPacket {
  Packet packet;
  WindowType type:8;
  bool pushing;
};

typedef struct WindowSignalPacket WindowSignalPacket;

struct __attribute__((__packed__)) WindowSignalPacket {
  Packet packet;
  uint32_t id;
};

typedef WindowSignalPacket WindowHidePacket;

typedef WindowHidePacket WindowEventPacket;

typedef WindowEventPacket WindowShowEventPacket;

typedef WindowEventPacket WindowHideEventPacket;

typedef struct WindowPropsPacket WindowPropsPacket;

struct __attribute__((__packed__)) WindowPropsPacket {
  Packet packet;
  uint32_t id;
  GColor background_color:8;
  bool fullscreen;
  bool scrollable;
};

typedef struct WindowButtonConfigPacket WindowButtonConfigPacket;

struct __attribute__((__packed__)) WindowButtonConfigPacket {
  Packet packet;
  uint8_t button_mask;
};

typedef struct WindowActionBarPacket WindowActionBarPacket;

struct __attribute__((__packed__)) WindowActionBarPacket {
  Packet packet;
  uint32_t image[3];
  bool action;
  GColor background_color:8;
};

typedef struct ClickPacket ClickPacket;

struct __attribute__((__packed__)) ClickPacket {
  Packet packet;
  ButtonId button:8;
};

typedef ClickPacket LongClickPacket;

typedef struct ImagePacket ImagePacket;

struct __attribute__((__packed__)) ImagePacket {
  Packet packet;
  uint32_t id;
  int16_t width;
  int16_t height;
  uint32_t pixels[];
};

typedef struct CardClearPacket CardClearPacket;

struct __attribute__((__packed__)) CardClearPacket {
  Packet packet;
  uint8_t flags;
};

typedef struct CardTextPacket CardTextPacket;

struct __attribute__((__packed__)) CardTextPacket {
  Packet packet;
  uint8_t index;
  char text[];
};

typedef struct CardImagePacket CardImagePacket;

struct __attribute__((__packed__)) CardImagePacket {
  Packet packet;
  uint32_t image;
  uint8_t index;
};

typedef struct CardStylePacket CardStylePacket;

struct __attribute__((__packed__)) CardStylePacket {
  Packet packet;
  uint8_t style;
};

typedef struct VibePacket VibePacket;

struct __attribute__((__packed__)) VibePacket {
  Packet packet;
  VibeType type:8;
};

typedef Packet AccelPeekPacket;

typedef struct AccelConfigPacket AccelConfigPacket;

struct __attribute__((__packed__)) AccelConfigPacket {
  Packet packet;
  uint16_t num_samples;
  AccelSamplingRate rate:8;
  bool data_subscribed;
};

typedef struct AccelTapPacket AccelTapPacket;

struct __attribute__((__packed__)) AccelTapPacket {
  Packet packet;
  AccelAxisType axis:8;
  int8_t direction;
};

typedef struct AccelDataPacket AccelDataPacket;

struct __attribute__((__packed__)) AccelDataPacket {
  Packet packet;
  bool is_peek;
  uint8_t num_samples;
  AccelData data[];
};

typedef Packet MenuClearPacket;

typedef struct MenuClearSectionPacket MenuClearSectionPacket;

struct __attribute__((__packed__)) MenuClearSectionPacket {
  Packet packet;
  uint16_t section;
};

typedef struct MenuPropsPacket MenuPropsPacket;

struct __attribute__((__packed__)) MenuPropsPacket {
  Packet packet;
  uint16_t num_sections;
};

typedef struct MenuSectionPacket MenuSectionPacket;

struct __attribute__((__packed__)) MenuSectionPacket {
  Packet packet;
  uint16_t section;
  uint16_t num_items;
  uint16_t title_length;
  char title[];
};

typedef struct MenuItemPacket MenuItemPacket;

struct __attribute__((__packed__)) MenuItemPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
  uint32_t icon;
  uint16_t title_length;
  uint16_t subtitle_length;
  char buffer[];
};

typedef struct MenuItemEventPacket MenuItemEventPacket;

struct __attribute__((__packed__)) MenuItemEventPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
};

typedef Packet MenuGetSelectionPacket;

typedef struct MenuSelectionPacket MenuSelectionPacket;

struct __attribute__((__packed__)) MenuSelectionPacket {
  Packet packet;
  uint16_t section;
  uint16_t item;
  MenuRowAlign align:8;
  bool animated;
};

typedef Packet StageClearPacket;

typedef struct ElementInsertPacket ElementInsertPacket;

struct __attribute__((__packed__)) ElementInsertPacket {
  Packet packet;
  uint32_t id;
  SimplyElementType type:8;
  uint16_t index;
};

typedef struct ElementRemovePacket ElementRemovePacket;

struct __attribute__((__packed__)) ElementRemovePacket {
  Packet packet;
  uint32_t id;
};

typedef struct ElementCommonPacket ElementCommonPacket;

struct __attribute__((__packed__)) ElementCommonPacket {
  Packet packet;
  uint32_t id;
  GRect frame;
  GColor background_color:8;
  GColor border_color:8;
};

typedef struct ElementRadiusPacket ElementRadiusPacket;

struct __attribute__((__packed__)) ElementRadiusPacket {
  Packet packet;
  uint32_t id;
  uint16_t radius;
};

typedef struct ElementTextPacket ElementTextPacket;

struct __attribute__((__packed__)) ElementTextPacket {
  Packet packet;
  uint32_t id;
  TimeUnits time_units:8;
  char text[];
};

typedef struct ElementTextStylePacket ElementTextStylePacket;

struct __attribute__((__packed__)) ElementTextStylePacket {
  Packet packet;
  uint32_t id;
  GColor color:8;
  GTextOverflowMode overflow_mode:8;
  GTextAlignment alignment:8;
  uint32_t custom_font;
  char system_font[];
};

typedef struct ElementImagePacket ElementImagePacket;

struct __attribute__((__packed__)) ElementImagePacket {
  Packet packet;
  uint32_t id;
  uint32_t image;
  GCompOp compositing:8;
};

typedef struct ElementAnimatePacket ElementAnimatePacket;

struct __attribute__((__packed__)) ElementAnimatePacket {
  Packet packet;
  uint32_t id;
  GRect frame;
  uint32_t duration;
  AnimationCurve curve:8;
};

typedef struct ElementAnimateDonePacket ElementAnimateDonePacket;

struct __attribute__((__packed__)) ElementAnimateDonePacket {
  Packet packet;
  uint32_t id;
};

static bool s_has_communicated = false;

static bool s_broadcast_window = true;

bool simply_msg_has_communicated() {
  return s_has_communicated;
}

static SimplyWindow *get_top_simply_window(Simply *simply) {
  Window *base_window = window_stack_get_top_window();
  if (!base_window) {
    return NULL;
  }
  SimplyWindow *window = window_get_user_data(base_window);
  if (!window || (void*) window == simply->splash) {
    return NULL;
  }
  return window;
}

static void handle_window_show_packet(Simply *simply, Packet *data) {
  WindowShowPacket *packet = (WindowShowPacket*) data;
  SimplyWindow *window = simply->windows[MIN(WindowTypeLast - 1, packet->type)];
  simply_window_stack_show(simply->window_stack, window, packet->pushing);
}

static void handle_window_hide_packet(Simply *simply, Packet *data) {
  WindowHidePacket *packet = (WindowHidePacket*) data;
  SimplyWindow *window = get_top_simply_window(simply);
  if (!window) {
    return;
  }
  if (window->id == packet->id) {
    simply_window_stack_pop(simply->window_stack, window);
  }
}

static void handle_window_props_packet(Simply *simply, Packet *data) {
  WindowPropsPacket *packet = (WindowPropsPacket*) data;
  SimplyWindow *window = get_top_simply_window(simply);
  if (!window) {
    return;
  }
  window->id = packet->id;
  simply_window_set_background_color(window, packet->background_color);
  simply_window_set_fullscreen(window, packet->fullscreen);
  simply_window_set_scrollable(window, packet->scrollable);
}

static void handle_window_button_config_packet(Simply *simply, Packet *data) {
  WindowButtonConfigPacket *packet = (WindowButtonConfigPacket*) data;
  SimplyWindow *window = get_top_simply_window(simply);
  if (!window) {
    return;
  }
  window->button_mask = packet->button_mask;
}

static void handle_window_action_bar_packet(Simply *simply, Packet *data) {
  WindowActionBarPacket *packet = (WindowActionBarPacket*) data;
  SimplyWindow *window = get_top_simply_window(simply);
  if (!window) {
    return;
  }
  simply_window_set_action_bar_background_color(window, packet->background_color);
  for (unsigned int i = 0; i < ARRAY_LENGTH(packet->image); ++i) {
    simply_window_set_action_bar_icon(window, i + 1, packet->image[i]);
  }
  simply_window_set_action_bar(window, packet->action);
}

static void handle_image_packet(Simply *simply, Packet *data) {
  ImagePacket *packet = (ImagePacket*) data;
  simply_res_add_image(simply->res, packet->id, packet->width, packet->height, packet->pixels);
}

static void handle_card_clear_packet(Simply *simply, Packet *data) {
  CardClearPacket *packet = (CardClearPacket*) data;
  simply_ui_clear(simply->ui, packet->flags);
}

static void handle_card_text_packet(Simply *simply, Packet *data) {
  CardTextPacket *packet = (CardTextPacket*) data;
  simply_ui_set_text(simply->ui, MIN(NumUiTextfields - 1, packet->index), packet->text);
}

static void handle_card_image_packet(Simply *simply, Packet *data) {
  CardImagePacket *packet = (CardImagePacket*) data;
  simply->ui->ui_layer.imagefields[MIN(NumUiImagefields - 1, packet->index)] = packet->image;
  window_stack_schedule_top_window_render();
}

static void handle_card_style_packet(Simply *simply, Packet *data) {
  CardStylePacket *packet = (CardStylePacket*) data;
  simply_ui_set_style(simply->ui, packet->style);
}

static void handle_vibe_packet(Simply *simply, Packet *data) {
  VibePacket *packet = (VibePacket*) data;
  switch (packet->type) {
    case VibeShort: vibes_short_pulse(); break;
    case VibeLong: vibes_long_pulse(); break;
    case VibeDouble: vibes_double_pulse(); break;
  }
}

static void accel_peek_timer_callback(void *context) {
  Simply *simply = context;
  AccelData data = { .x = 0 };
  simply_accel_peek(simply->accel, &data);
  if (!simply_msg_accel_data(simply->msg, &data, 1, true)) {
    app_timer_register(10, accel_peek_timer_callback, simply);
  }
}

static void handle_accel_peek_packet(Simply *simply, Packet *data) {
  app_timer_register(10, accel_peek_timer_callback, simply);
}

static void handle_accel_config_packet(Simply *simply, Packet *data) {
  AccelConfigPacket *packet = (AccelConfigPacket*) data;
  simply->accel->num_samples = packet->num_samples;
  simply->accel->rate = packet->rate;
  simply_accel_set_data_subscribe(simply->accel, packet->data_subscribed);
}

static void handle_menu_clear_packet(Simply *simply, Packet *data) {
  simply_menu_clear(simply->menu);
}

static void handle_menu_clear_section_packet(Simply *simply, Packet *data) {
  MenuClearSectionPacket *packet = (MenuClearSectionPacket*) data;
  simply_menu_clear_section_items(simply->menu, packet->section);
}

static void handle_menu_props_packet(Simply *simply, Packet *data) {
  MenuPropsPacket *packet = (MenuPropsPacket*) data;
  simply_menu_set_num_sections(simply->menu, packet->num_sections);
}

static void handle_menu_section_packet(Simply *simply, Packet *data) {
  MenuSectionPacket *packet = (MenuSectionPacket*) data;
  SimplyMenuSection *section = malloc(sizeof(*section));
  *section = (SimplyMenuSection) {
    .section = packet->section,
    .num_items = packet->num_items,
    .title = packet->title_length ? strdup2(packet->title) : NULL,
  };
  simply_menu_add_section(simply->menu, section);
}

static void handle_menu_item_packet(Simply *simply, Packet *data) {
  MenuItemPacket *packet = (MenuItemPacket*) data;
  SimplyMenuItem *item = malloc(sizeof(*item));
  *item = (SimplyMenuItem) {
    .section = packet->section,
    .item = packet->item,
    .title = packet->title_length ? strdup2(packet->buffer) : NULL,
    .subtitle = packet->subtitle_length ? strdup2(packet->buffer + packet->title_length + 1) : NULL,
    .icon = packet->icon,
  };
  simply_menu_add_item(simply->menu, item);
}

static void handle_menu_get_selection_packet(Simply *simply, Packet *data) {
  simply_msg_send_menu_selection(simply->msg);
}

static void handle_menu_selection_packet(Simply *simply, Packet *data) {
  MenuSelectionPacket *packet = (MenuSelectionPacket*) data;
  MenuIndex menu_index = {
    .section = packet->section,
    .row = packet->item,
  };
  simply_menu_set_selection(simply->menu, menu_index, packet->align, packet->animated);
}

static void handle_stage_clear_packet(Simply *simply, Packet *data) {
  simply_stage_clear(simply->stage);
}

static void handle_element_insert_packet(Simply *simply, Packet *data) {
  ElementInsertPacket *packet = (ElementInsertPacket*) data;
  SimplyElementCommon *element = simply_stage_auto_element(simply->stage, packet->id, packet->type);
  if (!element) {
    return;
  }
  simply_stage_insert_element(simply->stage, packet->index, element);
  simply_stage_update(simply->stage);
}

static void handle_element_remove_packet(Simply *simply, Packet *data) {
  ElementInsertPacket *packet = (ElementInsertPacket*) data;
  SimplyElementCommon *element = simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  simply_stage_remove_element(simply->stage, element);
  simply_stage_update(simply->stage);
}

static void handle_element_common_packet(Simply *simply, Packet *data) {
  ElementCommonPacket *packet = (ElementCommonPacket*) data;
  SimplyElementCommon *element = simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  simply_stage_set_element_frame(simply->stage, element, packet->frame);
  element->background_color = packet->background_color;
  element->border_color = packet->border_color;
  simply_stage_update(simply->stage);
}

static void handle_element_radius_packet(Simply *simply, Packet *data) {
  ElementRadiusPacket *packet = (ElementRadiusPacket*) data;
  SimplyElementRect *element = (SimplyElementRect*) simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  element->radius = packet->radius;
  simply_stage_update(simply->stage);
};

static void handle_element_text_packet(Simply *simply, Packet *data) {
  ElementTextPacket *packet = (ElementTextPacket*) data;
  SimplyElementText *element = (SimplyElementText*) simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  if (element->time_units != packet->time_units) {
    element->time_units = packet->time_units;
    simply_stage_update_ticker(simply->stage);
  }
  strset(&element->text, packet->text);
  simply_stage_update(simply->stage);
}

static void handle_element_text_style_packet(Simply *simply, Packet *data) {
  ElementTextStylePacket *packet = (ElementTextStylePacket*) data;
  SimplyElementText *element = (SimplyElementText*) simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  element->text_color = packet->color;
  element->overflow_mode = packet->overflow_mode;
  element->alignment = packet->alignment;
  if (packet->custom_font) {
    element->font = simply_res_get_font(simply->res, packet->custom_font);
  } else if (packet->system_font[0]) {
    element->font = fonts_get_system_font(packet->system_font);
  }
  simply_stage_update(simply->stage);
}

static void handle_element_image_packet(Simply *simply, Packet *data) {
  ElementImagePacket *packet = (ElementImagePacket*) data;
  SimplyElementImage *element = (SimplyElementImage*) simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  element->image = packet->image;
  element->compositing = packet->compositing;
  simply_stage_update(simply->stage);
}

static void handle_element_animate_packet(Simply *simply, Packet *data) {
  ElementAnimatePacket *packet = (ElementAnimatePacket*) data;
  SimplyElementCommon *element = simply_stage_get_element(simply->stage, packet->id);
  if (!element) {
    return;
  }
  SimplyAnimation *animation = malloc0(sizeof(*animation));
  animation->duration = packet->duration;
  animation->curve = packet->curve;
  simply_stage_animate_element(simply->stage, element, animation, packet->frame);
}

static void handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandWindowShow:
      handle_window_show_packet(simply, packet);
      break;
    case CommandWindowHide:
      handle_window_hide_packet(simply, packet);
      break;
    case CommandWindowShowEvent:
      break;
    case CommandWindowHideEvent:
      break;
    case CommandWindowProps:
      handle_window_props_packet(simply, packet);
      break;
    case CommandWindowButtonConfig:
      handle_window_button_config_packet(simply, packet);
      break;
    case CommandWindowActionBar:
      handle_window_action_bar_packet(simply, packet);
      break;
    case CommandClick:
      break;
    case CommandLongClick:
      break;
    case CommandImagePacket:
      handle_image_packet(simply, packet);
      break;
    case CommandCardClear:
      handle_card_clear_packet(simply, packet);
      break;
    case CommandCardText:
      handle_card_text_packet(simply, packet);
      break;
    case CommandCardImage:
      handle_card_image_packet(simply, packet);
      break;
    case CommandCardStyle:
      handle_card_style_packet(simply, packet);
      break;
    case CommandVibe:
      handle_vibe_packet(simply, packet);
      break;
    case CommandAccelPeek:
      handle_accel_peek_packet(simply, packet);
      break;
    case CommandAccelConfig:
      handle_accel_config_packet(simply, packet);
      break;
    case CommandAccelData:
      break;
    case CommandAccelTap:
      break;
    case CommandMenuClear:
      handle_menu_clear_packet(simply, packet);
      break;
    case CommandMenuClearSection:
      handle_menu_clear_section_packet(simply, packet);
      break;
    case CommandMenuProps:
      handle_menu_props_packet(simply, packet);
      break;
    case CommandMenuSection:
      handle_menu_section_packet(simply, packet);
      break;
    case CommandMenuGetSection:
      break;
    case CommandMenuItem:
      handle_menu_item_packet(simply, packet);
      break;
    case CommandMenuGetItem:
      break;
    case CommandMenuSelection:
      handle_menu_selection_packet(simply, packet);
      break;
    case CommandMenuGetSelection:
      handle_menu_get_selection_packet(simply, packet);
      break;
    case CommandMenuSelectionEvent:
      break;
    case CommandMenuSelect:
      break;
    case CommandMenuLongSelect:
      break;
    case CommandStageClear:
      handle_stage_clear_packet(simply, packet);
      break;
    case CommandElementInsert:
      handle_element_insert_packet(simply, packet);
      break;
    case CommandElementRemove:
      handle_element_remove_packet(simply, packet);
      break;
    case CommandElementCommon:
      handle_element_common_packet(simply, packet);
      break;
    case CommandElementRadius:
      handle_element_radius_packet(simply, packet);
      break;
    case CommandElementText:
      handle_element_text_packet(simply, packet);
      break;
    case CommandElementTextStyle:
      handle_element_text_style_packet(simply, packet);
      break;
    case CommandElementImage:
      handle_element_image_packet(simply, packet);
      break;
    case CommandElementAnimate:
      handle_element_animate_packet(simply, packet);
      break;
    case CommandElementAnimateDone:
      break;
  }
}

static void received_callback(DictionaryIterator *iter, void *context) {
  Tuple *tuple = dict_find(iter, 0);
  if (!tuple) {
    return;
  }

  s_has_communicated = true;

  size_t length = tuple->length;
  uint8_t *buffer = tuple->value->data;
  while (true) {
    Packet *packet = (Packet*) buffer;
    handle_packet(context, packet);

    length -= packet->length;
    if (length == 0) {
      break;
    }

    buffer += packet->length;
  }
}

static void dropped_callback(AppMessageResult reason, void *context) {
}

static void sent_callback(DictionaryIterator *iter, void *context) {
}

static void failed_callback(DictionaryIterator *iter, AppMessageResult reason, Simply *simply) {
  if (reason == APP_MSG_NOT_CONNECTED) {
    s_has_communicated = false;

    simply_msg_show_disconnected(simply->msg);
  }
}

void simply_msg_show_disconnected(SimplyMsg *self) {
  Simply *simply = self->simply;
  SimplyUi *ui = simply->ui;

  simply_ui_clear(ui, ~0);
  simply_ui_set_text(ui, UiSubtitle, "Disconnected");
  simply_ui_set_text(ui, UiBody, "Run the Pebble Phone App");

  if (get_top_simply_window(simply) != &ui->window) {
    bool was_broadcast = s_broadcast_window;
    s_broadcast_window = false;
    simply_window_stack_show(simply->window_stack, &ui->window, true);
    s_broadcast_window = was_broadcast;
  }
}

SimplyMsg *simply_msg_create(Simply *simply) {
  SimplyMsg *self = malloc(sizeof(*self));
  *self = (SimplyMsg) { .simply = simply };

  simply->msg = self;

  app_message_open(APP_MSG_SIZE_INBOUND, APP_MSG_SIZE_OUTBOUND);

  app_message_set_context(simply);

  app_message_register_inbox_received(received_callback);
  app_message_register_inbox_dropped(dropped_callback);
  app_message_register_outbox_sent(sent_callback);
  app_message_register_outbox_failed((AppMessageOutboxFailed) failed_callback);

  return self;
}

void simply_msg_destroy(SimplyMsg *self) {
  if (!self) {
    return;
  }

  app_message_deregister_callbacks();

  self->simply->msg = NULL;

  free(self);
}

static void destroy_packet(SimplyMsg *self, SimplyPacket *packet) {
  if (!packet) {
    return;
  }
  list1_remove(&self->queue, &packet->node);
  free(packet->buffer);
  packet->buffer = NULL;
  free(packet);
}

static bool send_msg(uint8_t *buffer, size_t length) {
  DictionaryIterator *iter = NULL;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return false;
  }
  dict_write_data(iter, 0, buffer, length);
  return (app_message_outbox_send() == APP_MSG_OK);
}

static void make_multi_packet(SimplyMsg *self, SimplyPacket *packet) {
  if (!packet) {
    return;
  }
  size_t length = 0;
  SimplyPacket *last;
  for (SimplyPacket *walk = packet;;) {
    length += walk->length;
    SimplyPacket *next = (SimplyPacket*) walk->node.next;
    if (!next || length + next->length > APP_MSG_SIZE_OUTBOUND - 2 * sizeof(Tuple)) {
      last = next;
      break;
    }
    walk = next;
  }
  uint8_t *buffer = malloc(length);
  if (!buffer) {
    return;
  }
  uint8_t *cursor = buffer;
  for (SimplyPacket *walk = packet; walk && walk != last;) {
    memcpy(cursor, walk->buffer, walk->length);
    cursor += walk->length;
    SimplyPacket *next = (SimplyPacket*) walk->node.next;
    destroy_packet(self, walk);
    walk = next;
  }
  self->send_buffer = buffer;
  self->send_length = length;
}

static void send_msg_retry(void *data) {
  SimplyMsg *self = data;
  self->send_timer = NULL;
  if (!self->send_buffer) {
    make_multi_packet(self, (SimplyPacket*) self->queue);
  }
  if (!self->send_buffer) {
    return;
  }
  if (send_msg(self->send_buffer, self->send_length)) {
    free(self->send_buffer);
    self->send_buffer = NULL;
    self->send_delay_ms = SEND_DELAY_MS;
  } else {
    self->send_delay_ms *= 2;
  }
  self->send_timer = app_timer_register(self->send_delay_ms, send_msg_retry, self);
}

static SimplyPacket *add_packet(SimplyMsg *self, Packet *buffer, Command type, size_t length) {
  SimplyPacket *packet = malloc0(sizeof(*packet));
  if (!packet) {
    free(buffer);
    return NULL;
  }
  *buffer = (Packet) {
    .type = type,
    .length = length,
  };
  *packet = (SimplyPacket) {
    .length = length,
    .buffer = buffer,
  };
  list1_append(&self->queue, &packet->node);
  if (self->send_delay_ms <= SEND_DELAY_MS) {
    if (self->send_timer) {
      app_timer_cancel(self->send_timer);
    }
    self->send_timer = app_timer_register(SEND_DELAY_MS, send_msg_retry, self);
  }
  return packet;
}

static bool send_click(SimplyMsg *self, Command type, ButtonId button) {
  size_t length;
  ClickPacket *packet = malloc0(length = sizeof(*packet));
  if (!packet) {
    return false;
  }
  packet->button = button;
  return add_packet(self, (Packet*) packet, type, length);
}

bool simply_msg_single_click(SimplyMsg *self, ButtonId button) {
  return send_click(self, CommandClick, button);
}

bool simply_msg_long_click(SimplyMsg *self, ButtonId button) {
  return send_click(self, CommandLongClick, button);
}

bool send_window(SimplyMsg *self, Command type, uint32_t id) {
  if (!s_broadcast_window) {
    return false;
  }
  size_t length;
  WindowEventPacket *packet = malloc0(length = sizeof(*packet));
  if (!packet) {
    return false;
  }
  packet->id = id;
  return add_packet(self, (Packet*) packet, type, length);
}

bool simply_msg_window_show(SimplyMsg *self, uint32_t id) {
  return send_window(self, CommandWindowShowEvent, id);
}

bool simply_msg_window_hide(SimplyMsg *self, uint32_t id) {
  return send_window(self, CommandWindowHideEvent, id);
}

bool simply_msg_accel_tap(SimplyMsg *self, AccelAxisType axis, int32_t direction) {
  size_t length;
  AccelTapPacket *packet = malloc0(length = sizeof(*packet));
  if (!packet) {
    return false;
  }
  packet->axis = axis;
  packet->direction = direction;
  return add_packet(self, (Packet*) packet, CommandAccelTap, length);
}

bool simply_msg_accel_data(SimplyMsg *self, AccelData *data, uint32_t num_samples, bool is_peek) {
  size_t data_length = sizeof(AccelData) * num_samples;
  size_t length;
  AccelDataPacket *packet = malloc(length = sizeof(AccelDataPacket) + data_length);
  if (!packet) {
    return false;
  }
  packet->packet = (Packet) {
    .type = CommandAccelData,
    .length = length,
  };
  packet->is_peek = is_peek;
  packet->num_samples = num_samples;
  memcpy(packet->data, data, data_length);
  bool result = send_msg((uint8_t*) packet, length);
  free(packet);
  return result;
}

static bool send_menu_item(SimplyMsg *self, Command type, uint16_t section, uint16_t item) {
  size_t length;
  MenuItemEventPacket *packet = malloc0(length = sizeof(*packet));
  if (!packet) {
    return false;
  }
  packet->section = section;
  packet->item = item;
  return add_packet(self, (Packet*) packet, type, length);
}

bool simply_msg_menu_get_section(SimplyMsg *self, uint16_t index) {
  return send_menu_item(self, CommandMenuGetSection, index, 0);
}

bool simply_msg_menu_get_item(SimplyMsg *self, uint16_t section, uint16_t index) {
  return send_menu_item(self, CommandMenuGetItem, section, index);
}

bool simply_msg_menu_select_click(SimplyMsg *self, uint16_t section, uint16_t index) {
  return send_menu_item(self, CommandMenuSelect, section, index);
}

bool simply_msg_menu_select_long_click(SimplyMsg *self, uint16_t section, uint16_t index) {
  return send_menu_item(self, CommandMenuLongSelect, section, index);
}

bool simply_msg_send_menu_selection(SimplyMsg *self) {
  MenuIndex menu_index = simply_menu_get_selection(self->simply->menu);
  return send_menu_item(self, CommandMenuSelectionEvent, menu_index.section, menu_index.row);
}

bool simply_msg_animate_element_done(SimplyMsg *self, uint32_t id) {
  size_t length;
  ElementAnimateDonePacket *packet = malloc0(length = sizeof(*packet));
  if (!packet) {
    return false;
  }
  packet->id = id;
  return add_packet(self, (Packet*) packet, CommandElementAnimateDone, length);
}

