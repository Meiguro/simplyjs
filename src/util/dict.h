#pragma once

#include <pebble.h>

static inline void *dict_copy_to_buffer(DictionaryIterator *iter, size_t *length_out) {
  size_t length = dict_size(iter);
  void *buffer = malloc(length);
  if (!buffer) {
    return NULL;
  }

  memcpy(buffer, iter->dictionary, length);
  if (length_out) {
    *length_out = length;
  }
  return buffer;
}

static inline void dict_copy_from_buffer(DictionaryIterator *iter, void *buffer, size_t length) {
  DictionaryIterator iter_copy = *iter;
  dict_read_first(&iter_copy);
  memcpy(iter->dictionary, buffer, length);
  iter->cursor = (void*) iter->dictionary + length;
}
