#include "simply_voice.h"

#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

typedef struct VoiceStartPacket VoiceStartPacket;

struct __attribute__((__packed__)) VoiceStartPacket {
  Packet packet;
  bool enableConfirmation;
};


typedef struct VoiceDataPacket VoiceDataPacket;

struct __attribute__((__packed__)) VoiceDataPacket {
  Packet packet;
  int8_t status;
  char result[SIMPLY_VOICE_BUFFER_LENGTH];
};

static SimplyVoice *s_voice;

static bool send_voice_data(int status, char *transcription) {
  VoiceDataPacket packet = {
    .packet.type = CommandVoiceData,
    .packet.length = sizeof(packet),
    .status = (uint8_t) status,
  };
  snprintf(packet.result, sizeof(packet.result), "%s", transcription);

  return simply_msg_send_packet(&packet.packet);
}

#ifndef PBL_SDK_2
// Define a callback for the dictation session
static void dictation_session_callback(DictationSession *session, DictationSessionStatus status, char *transcription, void *context) {
  s_voice->in_progress = false;

  // Send the result
  send_voice_data(status, transcription);
}
#endif

static void timer_callback_start_dictation(void *data) {
  dictation_session_start(s_voice->session);
}


static void handle_voice_start_packet(Simply *simply, Packet *data) {
  #ifdef PBL_SDK_2
  // send an immediate reply if we don't support voice
  send_voice_data(-1, "");
  #else

  // Send an immediate response if there's already a dictation session in progress
  if (s_voice->in_progress) {
    send_voice_data(-1, "");
    return;
  }

  // Otherwise, start the timer as soon as possible
  // (we start a timer so we can return true as quickly as possible)
  s_voice->in_progress = true;

  VoiceStartPacket *packet = (VoiceStartPacket*) data;
  dictation_session_enable_confirmation(s_voice->session, packet->enableConfirmation);
  s_voice->timer = app_timer_register(0, timer_callback_start_dictation, NULL);
  #endif
}

bool simply_voice_handle_packet(Simply *simply, Packet *packet) {
  switch (packet->type) {
    case CommandVoiceStart:
      handle_voice_start_packet(simply, packet);
      return true;
  }

  return false;
}

SimplyVoice *simply_voice_create(Simply *simply) {
  if(s_voice) {
    return s_voice;
  }

  SimplyVoice *self = malloc(sizeof(*self));
  *self = (SimplyVoice) {
    .simply = simply,
    .in_progress = false,
  };

  #ifndef PBL_SDK_2
  self->session = dictation_session_create(SIMPLY_VOICE_BUFFER_LENGTH, dictation_session_callback, NULL),
  #endif

  s_voice = self;
  return self;
}

void simply_voice_destroy(SimplyVoice *self) {
  if (!self) {
    return;
  }

  free(self);
  s_voice = NULL;
}
