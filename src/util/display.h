#pragma once

#include "util/none.h"

#if defined(PBL_RECT)
#define RECT_USAGE
#define ROUND_USAGE __attribute__((unused))
#elif defined(PBL_ROUND)
#define RECT_USAGE __attribute__((unused))
#define ROUND_USAGE
#endif
