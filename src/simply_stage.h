#pragma once

#include "simply_window.h"

#include "simplyjs.h"

#include "util/list1.h"

#include <pebble.h>

#define simply_stage_get_element(self, id) simply_stage_auto_element(self, id, SimplyElementTypeNone)

typedef struct SimplyStageLayer SimplyStageLayer;

typedef struct SimplyStage SimplyStage;

typedef struct SimplyStageItem SimplyStageItem;

typedef enum SimplyElementType SimplyElementType;

enum SimplyElementType {
  SimplyElementTypeNone = 0,
  SimplyElementTypeRect = 1,
  SimplyElementTypeCircle = 2,
  SimplyElementTypeText = 3,
  SimplyElementTypeImage = 4,
};

struct SimplyStageLayer {
  Layer *layer;
  List1Node *elements;
};

struct SimplyStage {
  SimplyWindow window;
  SimplyStageLayer stage_layer;
};

typedef struct SimplyElementCommon SimplyElementCommon;

#define SimplyElementCommonDef { \
  List1Node node;                \
  uint32_t id;                   \
  SimplyElementType type;        \
  GRect frame;                   \
  GColor background_color:2;     \
  GColor border_color:2;         \
}

struct SimplyElementCommon SimplyElementCommonDef;

#define SimplyElementCommonMember      \
  union {                              \
    struct SimplyElementCommon common; \
    struct SimplyElementCommonDef;     \
  }

typedef struct SimplyElementRect SimplyElementRect;

struct SimplyElementRect {
  SimplyElementCommonMember;
  uint16_t radius;
};

typedef struct SimplyElementRect SimplyElementCircle;

typedef struct SimplyElementText SimplyElementText;

struct SimplyElementText {
  union {
    struct SimplyElementRect common;
    struct SimplyElementCommonDef;
  };
  char *text;
  GFont font;
  GColor text_color:2;
  GTextOverflowMode overflow_mode;
  GTextAlignment alignment;
};

typedef struct SimplyElementImage SimplyElementImage;

struct SimplyElementImage {
  union {
    struct SimplyElementRect common;
    struct SimplyElementCommonDef;
  };
  uint32_t image;
  GCompOp compositing;
};

SimplyStage *simply_stage_create(Simply *simply);

void simply_stage_destroy(SimplyStage *self);

void simply_stage_show(SimplyStage *self);

void simply_stage_update(SimplyStage *self);

SimplyElementCommon* simply_stage_auto_element(SimplyStage *self, uint32_t id, SimplyElementType type);

SimplyElementCommon* simply_stage_insert_element(SimplyStage *self, int index, SimplyElementCommon *element);

SimplyElementCommon* simply_stage_remove_element(SimplyStage *self, SimplyElementCommon *element);
