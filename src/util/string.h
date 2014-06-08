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

  size_t n = strlen(str);
  char *buffer = malloc(n + 1);
  if (!buffer) {
    return NULL;
  }

  strncpy(buffer, str, n + 1);
  return buffer;
}

static inline void strset(char **str_field, const char *str) {
  free(*str_field);

  if (!is_string(str)) {
    *str_field = NULL;
    return;
  }

  *str_field = strdup2(str);
}

