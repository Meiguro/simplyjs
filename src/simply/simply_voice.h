#pragma once

#include "simply_msg.h"
#include "simply.h"

#include <pebble.h>

#define SIMPLY_VOICE_BUFFER_LENGTH 512

#ifdef PBL_SDK_2
typedef struct DictationSession DictationSession;
typedef struct DictationSessionStatus DictationSessionStatus;
void dictation_session_start(DictationSession *session);
#endif

typedef struct SimplyVoice SimplyVoice;

struct SimplyVoice {
  Simply *simply;
  DictationSession *session;
  AppTimer *timer;

  bool in_progress;
};

SimplyVoice *simply_voice_create(Simply *simply);
void simply_voice_destroy(SimplyVoice *self);

bool simply_voice_handle_packet(Simply *simply, Packet *packet);
