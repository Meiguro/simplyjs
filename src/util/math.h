#pragma once

#define MAX(a, b) ({ \
  __typeof__(a) __max_tmp_a = (a); \
  __typeof__(a) __max_tmp_b = (b); \
  (__max_tmp_a >= __max_tmp_b ? __max_tmp_a : __max_tmp_b); \
})

#define MIN(a, b) ({ \
  __typeof__(a) __min_tmp_a = (a); \
  __typeof__(a) __min_tmp_b = (b); \
  (__min_tmp_a <= __min_tmp_b ? __min_tmp_a : __min_tmp_b); \
})
