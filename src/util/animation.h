#pragma once

#include <pebble.h>

#ifndef PBL_COLOR

#undef property_animation_set_from_grect
static inline void property_animation_set_from_grect(PropertyAnimation *property_animation, GRect *from) {
  property_animation->values.from.grect = *from;
}

#undef property_animation_set_to_grect
static inline void property_animation_set_to_grect(PropertyAnimation *property_animation, GRect *to) {
  property_animation->values.to.grect = *to;
}

#endif
