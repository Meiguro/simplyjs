#include "simply_window_stack.h"

#include "simply_window.h"
#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

void simply_window_stack_show(SimplyWindowStack *self, SimplyWindow *window, bool is_push) {
  bool animated = (self->simply->splash == NULL);

  self->is_showing = true;
  window_stack_pop_all(!is_push);
  self->is_showing = false;

  Window *temp_window = NULL;
  if (is_push) {
    temp_window = window_create();
    window_stack_push(temp_window, false);
  }

  window_stack_push(window->window, animated);

  if (is_push) {
    window_stack_remove(temp_window, false);
    window_destroy(temp_window);
  }
}

void simply_window_stack_pop(SimplyWindowStack *self, SimplyWindow *window) {
  self->is_hiding = true;
  if (window->window == window_stack_get_top_window()) {
    bool animated = true;
    window_stack_pop(animated);
  }
  self->is_hiding = false;
}

void simply_window_stack_back(SimplyWindowStack *self, SimplyWindow *window) {
  self->is_hiding = true;
  simply_window_stack_send_hide(self, window);
  self->is_hiding = false;
}

void simply_window_stack_send_show(SimplyWindowStack *self, SimplyWindow *window) {
  if (self->is_showing) {
    return;
  }
  simply_msg_window_show(self->simply->msg, window->id);
}

void simply_window_stack_send_hide(SimplyWindowStack *self, SimplyWindow *window) {
  if (self->is_showing) {
    return;
  }
  simply_msg_window_hide(self->simply->msg, window->id);
  if (!self->is_hiding) {
    window_stack_push(window->window, false);
  }
}

SimplyWindowStack *simply_window_stack_create(Simply *simply) {
  SimplyWindowStack *self = malloc(sizeof(*self));
  *self = (SimplyWindowStack) { .simply = simply };

  return self;
}

void simply_window_stack_destroy(SimplyWindowStack *self) {
  if (!self) {
    return;
  }

  free(self);
}
