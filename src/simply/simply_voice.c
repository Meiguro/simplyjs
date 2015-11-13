#include "simply_voice.h"

#include "simply_msg.h"

#include "simply.h"

#include <pebble.h>

typedef struct VoiceDataPacket VoiceDataPacket;

struct __attribute__((__packed__)) VoiceDataPacket {
  Packet packet;
  int8_t status;
  char result[SIMPLY_VOICE_BUFFER_LENGTH];
};

static SimplyVoice *s_voice = NULL;

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
  static void dictation_session_callback(DictationSession *session, DictationSessionStatus status, char *transcription, void *context) {
    s_voice->inProgress = false;

    // Send the result
    send_voice_data(status, transcription);
  }
#endif

static void handle_voice_start_packet(Simply *simply, Packet *data) {
  #ifdef PBL_SDK_2
  send_voice_data(-1, "");
  #else

  if (s_voice->inProgress) {
    return;
  }

  s_voice->inProgress = true;
  dictation_session_start(s_voice->session);

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
    .inProgress = false,
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
