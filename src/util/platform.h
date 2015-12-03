#pragma once

#include "util/none.h"

#if defined(PBL_PLATFORM_APLITE) || defined(PBL_SDK_2)
#define IF_APLITE_ELSE(aplite, other) aplite
#define APLITE_USAGE
#else
#define IF_APLITE_ELSE(aplite, other) other
#define APLITE_USAGE __attribute__((unused))
#endif

#if defined(PBL_PLATFORM_BASALT)
#define IF_BASALT_ELSE(basalt, other) basalt
#define BASALT_USAGE
#else
#define IF_BASALT_ELSE(basalt, other) other
#define BASALT_USAGE __attribute__((unused))
#endif

#if defined(PBL_PLATFORM_CHALK)
#define IF_CHALK_ELSE(chalk, other) chalk
#define CHALK_USAGE
#else
#define IF_CHALK_ELSE(chalk, other) other
#define CHALK_USAGE __attribute__((unused))
#endif
