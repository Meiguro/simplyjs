#pragma once

#include <stdlib.h>
#include <string.h>

static inline void *malloc0(size_t size) {
  void *buf = malloc(size);
  if (!buf) {
    return buf;
  }

  memset(buf, 0, size);
  return buf;
}

