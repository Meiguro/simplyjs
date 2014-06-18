#pragma once

#include "simply_window.h"

#include "simply.h"

#include <pebble.h>

typedef struct SimplyWindowStack SimplyWindowStack;

struct SimplyWindowStack {
  Simply *simply;
  Window *pusher;
  bool is_showing:1;
  bool is_hiding:1;
};

SimplyWindowStack *simply_window_stack_create(Simply *simply);
void simply_window_stack_destroy(SimplyWindowStack *self);

void simply_window_stack_show(SimplyWindowStack *self, SimplyWindow *window, bool is_push);
void simply_window_stack_pop(SimplyWindowStack *self, SimplyWindow *window);
void simply_window_stack_back(SimplyWindowStack *self, SimplyWindow *window);

void simply_window_stack_send_show(SimplyWindowStack *self, SimplyWindow *window);
void simply_window_stack_send_hide(SimplyWindowStack *self, SimplyWindow *window);
