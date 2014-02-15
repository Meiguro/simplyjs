#pragma once

#include "simply_accel.h"
#include "simply_ui.h"

#define LOG(...) APP_LOG(APP_LOG_LEVEL_DEBUG, __VA_ARGS__)

typedef struct Simply Simply;

struct Simply {
  SimplyAccel *accel;
  SimplyUi *ui;
};

