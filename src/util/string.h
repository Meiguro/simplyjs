#pragma once

#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

static inline bool is_string(const char *str) {
  return str && str[0];
}

static inline char *strdup2(const char *str) {
  if (!str) {
    return NULL;
  }

  char *buffer = malloc(strlen(str) + 1);
  strcpy(buffer, str);
  return buffer;
}
