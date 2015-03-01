#pragma once

#include <pebble.h>

#ifdef PBL_BW

static inline void property_animation_set_from_grect(PropertyAnimation *property_animation, GRect *from) {
  property_animation->values.from.grect = *from;
}

static inline void property_animation_set_to_grect(PropertyAnimation *property_animation, GRect *to) {
  property_animation->values.to.grect = *to;
}

#endif
