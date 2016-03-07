#pragma once

#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

static inline bool is_string(const char *str) {
  return str && str[0];
}

static inline size_t strlen2(const char *str) {
  return is_string(str) ? strlen(str) : 0;
}

static inline char *strndup2(const char *str, size_t n) {
  if (!str) {
    return NULL;
  }

  char *buffer = malloc(n + 1);
  if (!buffer) {
    return NULL;
  }

  strncpy(buffer, str, n + 1);
  buffer[n] = '\0';
  return buffer;
}

static inline char *strdup2(const char *str) {
  return strndup2(str, strlen2(str));
}

static inline bool strnset(char **str_field, const char *str, size_t n) {
  free(*str_field);
  *str_field = NULL;

  if (!is_string(str)) {
    return true;
  }

  return (*str_field = strndup2(str, n));
}

static inline bool strset(char **str_field, const char *str) {
  return strnset(str_field, str, strlen2(str));
}

static inline void strset_truncated(char **str_field, const char *str) {
  size_t n = strlen2(str);
  for (; !strnset(str_field, str, n) && n > 1; n /= 2) {}
}
