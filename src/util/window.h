#pragma once

#include <pebble.h>

static inline void window_stack_schedule_top_window_render() {
  layer_mark_dirty(window_get_root_layer(window_stack_get_top_window()));
}
