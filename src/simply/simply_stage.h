#pragma once

#include "simply_window.h"

#include "simply.h"

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
  SimplyElementTypeInverter = 5,
};

struct SimplyStageLayer {
  Layer *layer;
  List1Node *elements;
  List1Node *animations;
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
  TimeUnits time_units:8;
  GColor text_color:2;
  GTextOverflowMode overflow_mode:2;
  GTextAlignment alignment:2;
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

typedef struct SimplyElementInverter SimplyElementInverter;

struct SimplyElementInverter {
  SimplyElementCommonMember;
  InverterLayer *inverter_layer;
};

typedef struct SimplyAnimation SimplyAnimation;

struct SimplyAnimation {
  List1Node node;
  SimplyStage *stage;
  SimplyElementCommon *element;
  PropertyAnimation *animation;
  uint32_t duration;
  AnimationCurve curve;
};

SimplyStage *simply_stage_create(Simply *simply);
void simply_stage_destroy(SimplyStage *self);

void simply_stage_clear(SimplyStage *self);

void simply_stage_update(SimplyStage *self);
void simply_stage_update_ticker(SimplyStage *self);

SimplyElementCommon* simply_stage_auto_element(SimplyStage *self, uint32_t id, SimplyElementType type);
SimplyElementCommon* simply_stage_insert_element(SimplyStage *self, int index, SimplyElementCommon *element);
SimplyElementCommon* simply_stage_remove_element(SimplyStage *self, SimplyElementCommon *element);

void simply_stage_set_element_frame(SimplyStage *self, SimplyElementCommon *element, GRect frame);

SimplyAnimation *simply_stage_animate_element(SimplyStage *self,
    SimplyElementCommon *element, SimplyAnimation* animation, GRect to_frame);
