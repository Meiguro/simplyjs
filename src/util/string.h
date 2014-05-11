#pragma once

#include <stdlib.h>
#include <string.h>

static inline char *strdup2(const char *str) {
  if (!str) {
    return NULL;
  }

  char *buffer = malloc(strlen(str) + 1);
  strcpy(buffer, str);
  return buffer;
}
