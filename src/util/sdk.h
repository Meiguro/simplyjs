#pragma once

#include "util/none.h"

#ifdef PBL_SDK_3
#define SDK_SELECT(sdk3, sdk2) sdk3
#else
#define SDK_SELECT(sdk3, sdk2) sdk2
#endif
