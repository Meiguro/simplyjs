#pragma once

#include "simply_msg.h"
#include "simply.h"
#include "util/compat.h"

#include <pebble.h>

#define SIMPLY_VOICE_BUFFER_LENGTH 512

typedef struct SimplyVoice SimplyVoice;

struct SimplyVoice {
  Simply *simply;
  DictationSession *session;
  AppTimer *timer;

  bool in_progress;
};

#if defined(PBL_PLATFORM_APLITE)

#define simply_voice_create(simply) NULL
#define simply_voice_destroy(self)

#define simply_voice_handle_packet(simply, packet) (false)

#define simply_voice_dictation_in_progress() (false)

#else

SimplyVoice *simply_voice_create(Simply *simply);
void simply_voice_destroy(SimplyVoice *self);

bool simply_voice_handle_packet(Simply *simply, Packet *packet);

bool simply_voice_dictation_in_progress();

#endif
