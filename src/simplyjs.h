#pragma once

#define LOG(...) APP_LOG(APP_LOG_LEVEL_DEBUG, __VA_ARGS__)

typedef struct Simply Simply;

struct Simply {
  struct SimplyAccel *accel;
  struct SimplyRes *res;
  struct SimplySplash *splash;
  struct SimplyStage *stage;
  struct SimplyMenu *menu;
  struct SimplyUi *ui;
};

